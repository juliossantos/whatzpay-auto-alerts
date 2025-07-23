
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, isOverdue, getDaysUntilDue, getDaysOverdue } from "@/utils/dateUtils";
import { Invoice, Message } from "@/types";
import { formatMessageWithVariables, getMessageVariables, sendWhatsAppMessage } from "@/utils/wppConnectApi";
import { sendEmail, formatEmailWithVariables, getEmailSubject } from "@/utils/emailApi";
import { getCurrentDateISOString } from "@/utils/dateUtils";
import { v4 as uuidv4 } from "uuid";

interface InvoiceListProps {
  invoices: Invoice[];
  onUpdateInvoice: (updatedInvoice: Invoice) => void;
  onAddMessage: (message: Message) => void;
  messageTemplates: {
    reminder: string;
    overdue: string;
  };
}

const InvoiceList: React.FC<InvoiceListProps> = ({ 
  invoices, 
  onUpdateInvoice, 
  onAddMessage,
  messageTemplates
}) => {
  const { toast } = useToast();
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const handleMarkAsPaid = (invoice: Invoice) => {
    setMarkingPaidId(invoice.id);
    
    setTimeout(() => {
      const updatedInvoice = {
        ...invoice,
        isPaid: true
      };
      onUpdateInvoice(updatedInvoice);
      setMarkingPaidId(null);
      
      toast({
        title: "Fatura paga",
        description: `A fatura de ${invoice.customerName} foi marcada como paga.`
      });
    }, 500);
  };
  
  const sendManualMessage = async (invoice: Invoice, messageType: 'reminder' | 'overdue') => {
    setSendingMessageId(invoice.id);
    
    try {
      // Select template based on message type
      const templateContent = messageType === 'reminder' 
        ? messageTemplates.reminder 
        : messageTemplates.overdue;

      // Prepare variables for template
      const variables = getMessageVariables(
        invoice, 
        messageType === 'overdue' ? getDaysOverdue(invoice.dueDate) : undefined
      );
      
      // Format message with variables
      const messageContent = invoice.contactMethod === 'email' 
        ? formatEmailWithVariables(templateContent, variables)
        : formatMessageWithVariables(templateContent, variables);
      
      // Send message using the appropriate API
      const response = invoice.contactMethod === 'email' 
        ? await sendEmail(
            invoice.email!, 
            getEmailSubject(messageType, invoice.customerName),
            messageContent
          )
        : await sendWhatsAppMessage(invoice.whatsappNumber!, messageContent);
      
      // Record the message in history
      const message: Message = {
        id: uuidv4(),
        invoiceId: invoice.id,
        customerName: invoice.customerName,
        whatsappNumber: invoice.contactMethod === 'whatsapp' ? invoice.whatsappNumber : undefined,
        email: invoice.contactMethod === 'email' ? invoice.email : undefined,
        content: messageContent,
        sentAt: getCurrentDateISOString(),
        deliveryStatus: response.success ? 'sent' : 'failed',
        messageType: 'manual',
        contactMethod: invoice.contactMethod,
      };
      
      onAddMessage(message);
      
      // Show toast based on result
      if (response.success) {
        toast({
          title: "Mensagem enviada",
          description: `A mensagem foi enviada para ${invoice.customerName}.`
        });
      } else {
        toast({
          title: "Erro ao enviar",
          description: `Não foi possível enviar a mensagem: ${response.error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao tentar enviar a mensagem.",
        variant: "destructive"
      });
    } finally {
      setSendingMessageId(null);
    }
  };
  
  const getStatusBadge = (invoice: Invoice) => {
    if (invoice.isPaid) {
      return <Badge className="bg-green-500">Pago</Badge>;
    }
    
    if (isOverdue(invoice.dueDate)) {
      const daysOverdue = getDaysOverdue(invoice.dueDate);
      return (
        <Badge variant="destructive">
          {daysOverdue === 1 
            ? '1 dia em atraso' 
            : `${daysOverdue} dias em atraso`}
        </Badge>
      );
    }
    
    const daysUntilDue = getDaysUntilDue(invoice.dueDate);
    if (daysUntilDue <= 3) {
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-500">
          {daysUntilDue === 0 
            ? 'Vence hoje' 
            : daysUntilDue === 1 
              ? 'Vence amanhã' 
              : `Vence em ${daysUntilDue} dias`}
        </Badge>
      );
    }
    
    return <Badge variant="outline">A vencer</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Faturas</CardTitle>
        <CardDescription>
          Gerenciamento de faturas e envio de mensagens.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Nenhuma fatura cadastrada.</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cód. Cliente</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>N° Pedido/NF</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.customerCode || "-"}</TableCell>
                    <TableCell className="font-medium">{invoice.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium">
                          {invoice.contactMethod === 'whatsapp' ? 'WhatsApp' : 'Email'}
                        </span>
                        <span className="text-sm">
                          {invoice.contactMethod === 'whatsapp' ? invoice.whatsappNumber : invoice.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.orderNumber || "-"}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(invoice.amount)}
                    </TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{getStatusBadge(invoice)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {!invoice.isPaid && (invoice.whatsappNumber || invoice.email) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={sendingMessageId === invoice.id}
                              onClick={() => sendManualMessage(invoice, 'reminder')}
                            >
                              {sendingMessageId === invoice.id ? "Enviando..." : "Lembrete"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={sendingMessageId === invoice.id || markingPaidId === invoice.id}
                              onClick={() => handleMarkAsPaid(invoice)}
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            >
                              {markingPaidId === invoice.id ? "Salvando..." : "Marcar Pago"}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceList;
