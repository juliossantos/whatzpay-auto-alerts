
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import * as XLSX from "xlsx";
import { Invoice, ImportResult } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { getCurrentDateISOString } from "@/utils/dateUtils";
import { Import } from "lucide-react";

interface InvoiceImportProps {
  onAddInvoices: (invoices: Invoice[]) => void;
  existingInvoices: Invoice[];
}

const InvoiceImport: React.FC<InvoiceImportProps> = ({ onAddInvoices, existingInvoices }) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processedRows, setProcessedRows] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [skippedInvoices, setSkippedInvoices] = useState<ImportResult["skippedInvoices"]>([]);
  const [showSkipped, setShowSkipped] = useState(false);

  const formatWhatsAppNumber = (input: string) => {
    if (!input) return "";
    
    // Remove all non-digits
    let digitsOnly = input.toString().replace(/\D/g, "");
    
    // Ensure it starts with country code if not present
    if (digitsOnly.length > 0 && !digitsOnly.startsWith("55")) {
      digitsOnly = "55" + digitsOnly;
    }
    
    return digitsOnly;
  };

  const isDuplicateInvoice = (orderNumber: string | undefined): boolean => {
    if (!orderNumber) return false;
    return existingInvoices.some(invoice => 
      invoice.orderNumber === orderNumber && !invoice.isPaid
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setError(null);
    setProgress(0);
    setSkippedInvoices([]);
    setShowSkipped(false);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      setTotalRows(jsonData.length);
      
      if (jsonData.length === 0) {
        throw new Error("A planilha está vazia");
      }
      
      // Check required fields in the first row
      const firstRow = jsonData[0] as Record<string, any>;
      const requiredFields = ['nome', 'valor', 'vencimento', 'whatsapp'];
      const missingFields = requiredFields.filter(field => 
        !Object.keys(firstRow).some(header => 
          header.toLowerCase().includes(field.toLowerCase())
        )
      );
      
      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios não encontrados: ${missingFields.join(', ')}`);
      }
      
      // Process data and create invoices
      const newInvoices: Invoice[] = [];
      const skippedRows: ImportResult["skippedInvoices"] = [];
      const importedOrderNumbers = new Set<string>();
      let processed = 0;
      
      for (const row of jsonData) {
        const rowData = row as Record<string, any>;
        
        // Find column names (case insensitive)
        const getColumnValue = (keywords: string[]): string => {
          const column = Object.keys(rowData).find(header => 
            keywords.some(keyword => header.toLowerCase().includes(keyword.toLowerCase()))
          );
          return column ? rowData[column]?.toString() : '';
        };
        
        const customerName = getColumnValue(['nome', 'cliente', 'customer']);
        const customerCode = getColumnValue(['código', 'code', 'cod']);
        const amountStr = getColumnValue(['valor', 'amount', 'price']);
        const dueDateStr = getColumnValue(['vencimento', 'due', 'data']);
        const whatsappStr = getColumnValue(['whatsapp', 'telefone', 'phone']);
        const paymentLink = getColumnValue(['link', 'pagamento', 'payment']);
        const orderNumber = getColumnValue(['pedido', 'nf', 'nota', 'order']);
        
        // Validate required fields
        if (!customerName || !amountStr || !dueDateStr || !whatsappStr) {
          console.warn("Linha ignorada - dados incompletos:", rowData);
          continue;
        }
        
        // Process amount
        let amount = 0;
        try {
          // Remove currency symbols and convert commas to periods
          const cleanAmount = amountStr.replace(/[^\d.,]/g, '').replace(',', '.');
          amount = parseFloat(cleanAmount);
          if (isNaN(amount)) throw new Error("Valor inválido");
        } catch (e) {
          console.warn("Erro ao processar valor:", amountStr);
          continue;
        }
        
        // Process date
        let dueDate = '';
        try {
          // Try to parse the date (handle various formats)
          let dateObj: Date;
          
          // Check if it's in Excel date format (number of days since 1/1/1900)
          if (/^\d+$/.test(dueDateStr)) {
            dateObj = new Date((parseInt(dueDateStr) - 25569) * 86400 * 1000);
          }
          // Check if it's in DD/MM/YYYY format
          else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dueDateStr)) {
            const [day, month, year] = dueDateStr.split('/').map(Number);
            dateObj = new Date(year, month - 1, day);
          }
          // Check if it's in YYYY-MM-DD format
          else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dueDateStr)) {
            dateObj = new Date(dueDateStr);
          } else {
            // Try to let JavaScript parse it
            dateObj = new Date(dueDateStr);
          }
          
          if (isNaN(dateObj.getTime())) throw new Error("Data inválida");
          
          // Format to YYYY-MM-DD
          dueDate = dateObj.toISOString().split('T')[0];
        } catch (e) {
          console.warn("Erro ao processar data:", dueDateStr);
          continue;
        }
        
        // Format WhatsApp number
        const whatsappNumber = formatWhatsAppNumber(whatsappStr);
        if (whatsappNumber.length < 10) {
          console.warn("Número de WhatsApp inválido:", whatsappStr);
          continue;
        }

        // Check if this invoice already exists (has the same order number and is not paid)
        if (orderNumber && isDuplicateInvoice(orderNumber)) {
          // Skip this invoice but log it
          skippedRows.push({
            customerName,
            orderNumber,
            amount
          });
          processed++;
          setProcessedRows(processed);
          setProgress(Math.floor((processed / jsonData.length) * 100));
          continue;
        }

        // Add order number to tracking set
        if (orderNumber) {
          importedOrderNumbers.add(orderNumber);
        }
        
        // Create invoice
        const invoice: Invoice = {
          id: uuidv4(),
          customerName,
          customerCode: customerCode || undefined,
          whatsappNumber,
          amount,
          dueDate,
          isPaid: false,
          paymentLink: paymentLink || undefined,
          orderNumber: orderNumber || undefined,
          createdAt: getCurrentDateISOString(),
        };
        
        newInvoices.push(invoice);
        processed++;
        setProcessedRows(processed);
        setProgress(Math.floor((processed / jsonData.length) * 100));
      }
      
      // Check for paid invoices (invoices with order numbers that were in the previous import but not in this one)
      if (existingInvoices.length > 0 && newInvoices.length > 0) {
        const updatedInvoices: Invoice[] = [];
        
        for (const existingInvoice of existingInvoices) {
          // If an invoice has an order number, it's not in the new import, and it's not paid yet
          if (
            existingInvoice.orderNumber && 
            !existingInvoice.isPaid && 
            !importedOrderNumbers.has(existingInvoice.orderNumber)
          ) {
            // Mark it as paid
            updatedInvoices.push({
              ...existingInvoice,
              isPaid: true
            });
          }
        }
        
        // Update the paid invoices
        if (updatedInvoices.length > 0) {
          updatedInvoices.forEach(invoice => {
            const index = existingInvoices.findIndex(i => i.id === invoice.id);
            if (index >= 0) {
              existingInvoices[index] = invoice;
            }
          });
          
          toast({
            title: "Pagamentos detectados",
            description: `${updatedInvoices.length} faturas foram marcadas como pagas automaticamente.`
          });
        }
      }
      
      if (newInvoices.length === 0 && skippedRows.length === 0) {
        throw new Error("Nenhuma fatura válida foi encontrada na planilha.");
      }
      
      // Store skipped invoices for display
      if (skippedRows.length > 0) {
        setSkippedInvoices(skippedRows);
        setShowSkipped(true);
      }
      
      // Add the new invoices
      if (newInvoices.length > 0) {
        onAddInvoices(newInvoices);
      }
      
      // Show appropriate toast based on results
      if (newInvoices.length > 0 && skippedRows.length > 0) {
        toast({
          title: "Importação concluída",
          description: `${newInvoices.length} faturas importadas. ${skippedRows.length} faturas foram ignoradas por já existirem.`
        });
      } else if (newInvoices.length > 0) {
        toast({
          title: "Importação concluída",
          description: `${newInvoices.length} faturas foram importadas com sucesso.`
        });
      } else if (skippedRows.length > 0) {
        toast({
          title: "Nenhuma fatura importada",
          description: `Todas as ${skippedRows.length} faturas já existem no sistema.`,
          variant: "destructive"
        });
      }
      
      // Reset the file input
      e.target.value = '';
      
    } catch (error: any) {
      console.error("Erro na importação:", error);
      setError(error.message || "Ocorreu um erro ao importar a planilha.");
      
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro ao importar a planilha.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setIsImporting(false);
        setProgress(0);
        setProcessedRows(0);
        setTotalRows(0);
      }, 1000);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Importar Faturas</CardTitle>
        <CardDescription>
          Importe faturas a partir de uma planilha Excel (.xlsx).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            disabled={isImporting}
          />
          
          <p className="text-xs text-muted-foreground">
            A planilha deve conter colunas para: Nome do cliente, Valor, Data de vencimento e WhatsApp.
            Opcionais: Código do cliente, Link de pagamento e Número do pedido/NF.
          </p>
        </div>
        
        {isImporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Processando...</span>
              <span>{processedRows} de {totalRows} registros</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {showSkipped && skippedInvoices.length > 0 && (
          <div className="mt-4 border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">
              Faturas ignoradas ({skippedInvoices.length})
            </h4>
            <div className="max-h-40 overflow-y-auto text-xs">
              <table className="w-full">
                <thead className="font-medium">
                  <tr>
                    <th className="text-left py-1">Cliente</th>
                    <th className="text-left py-1">Nº Pedido/NF</th>
                    <th className="text-right py-1">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {skippedInvoices.map((invoice, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-1">{invoice.customerName}</td>
                      <td className="py-1">{invoice.orderNumber || 'N/A'}</td>
                      <td className="py-1 text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <label htmlFor="file-upload" className="w-full">
          <Button 
            variant="outline" 
            disabled={isImporting}
            className="w-full flex items-center gap-2"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Import size={16} />
            <span>{isImporting ? "Importando..." : "Selecionar Arquivo"}</span>
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            disabled={isImporting}
            className="hidden"
          />
        </label>
      </CardFooter>
    </Card>
  );
};

export default InvoiceImport;
