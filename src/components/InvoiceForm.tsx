
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Invoice } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { getCurrentDateISOString } from "@/utils/dateUtils";
import { cn } from "@/lib/utils";

interface InvoiceFormProps {
  onAddInvoice: (invoice: Invoice) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onAddInvoice }) => {
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [paymentLink, setPaymentLink] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatWhatsAppNumber = (input: string) => {
    // Remove all non-digits
    let digitsOnly = input.replace(/\D/g, "");
    
    // Ensure it starts with country code if not present
    if (digitsOnly.length > 0 && !digitsOnly.startsWith("55")) {
      digitsOnly = "55" + digitsOnly;
    }
    
    return digitsOnly;
  };

  // Handle date selection from the calendar
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      // Format the date as YYYY-MM-DD for the dueDate field
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      setDueDate(formattedDate);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !whatsappNumber || !amount || !dueDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const formattedNumber = formatWhatsAppNumber(whatsappNumber);
    
    const newInvoice: Invoice = {
      id: uuidv4(),
      customerName,
      customerCode: customerCode || undefined,
      whatsappNumber: formattedNumber,
      amount: parseFloat(amount),
      dueDate,
      isPaid: false,
      paymentLink: paymentLink || undefined,
      orderNumber: orderNumber || undefined,
      createdAt: getCurrentDateISOString(),
    };
    
    // Simulate network delay
    setTimeout(() => {
      onAddInvoice(newInvoice);
      
      // Reset form
      setCustomerName("");
      setCustomerCode("");
      setWhatsappNumber("");
      setAmount("");
      setDueDate("");
      setDate(undefined);
      setPaymentLink("");
      setOrderNumber("");
      
      toast({
        title: "Fatura cadastrada",
        description: "A fatura foi cadastrada com sucesso.",
      });
      
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nova Fatura</CardTitle>
        <CardDescription>
          Cadastre uma nova fatura para envio de alertas pelo WhatsApp.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerCode">Código do Cliente</Label>
              <Input
                id="customerCode"
                placeholder="Código ou ID"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome do Cliente *</Label>
              <Input
                id="customerName"
                placeholder="Nome completo"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">Número de WhatsApp *</Label>
            <Input
              id="whatsappNumber"
              placeholder="Ex: 5511999999999"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Formato: 55 + DDD + número
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">N° Pedido/NF</Label>
              <Input
                id="orderNumber"
                placeholder="Número do pedido ou nota fiscal"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                    id="dueDate"
                  >
                    {date ? format(date, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <input 
                type="hidden" 
                name="dueDate" 
                value={dueDate} 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentLink">Link para Pagamento</Label>
              <Input
                id="paymentLink"
                type="url"
                placeholder="https://"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Cadastrando..." : "Cadastrar Fatura"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default InvoiceForm;
