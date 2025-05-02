
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Invoice, Message } from "@/types";
import { 
  formatDate, 
  isOverdue, 
  getDaysOverdue,
  shouldSendReminder,
  shouldSendOverdue,
  getCurrentDateISOString
} from "@/utils/dateUtils";
import { 
  formatMessageWithVariables, 
  getMessageVariables, 
  sendWhatsAppMessage 
} from "@/utils/wppConnectApi";
import { v4 as uuidv4 } from "uuid";
import { Calendar, Send } from "lucide-react";

interface DashboardProps {
  invoices: Invoice[];
  messages: Message[];
  messageTemplates: {
    reminder: string;
    overdue: string;
  };
  onAddMessage: (message: Message) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  invoices, 
  messages, 
  messageTemplates,
  onAddMessage 
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [includePrevious, setIncludePrevious] = useState(true);

  // Dashboard stats
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(invoice => invoice.isPaid).length;
  const pendingInvoices = invoices.filter(invoice => !invoice.isPaid).length;
  const overdueInvoices = invoices.filter(invoice => !invoice.isPaid && isOverdue(invoice.dueDate)).length;
  
  const totalMessages = messages.length;
  const sentMessages = messages.filter(message => message.deliveryStatus === 'sent' || message.deliveryStatus === 'delivered' || message.deliveryStatus === 'read').length;
  const failedMessages = messages.filter(message => message.deliveryStatus === 'failed').length;
  
  // Função para verificar se deve enviar lembrete no dia anterior (4 dias antes)
  const shouldSendReminderPrevious = (dueDate: string): boolean => {
    const daysUntilDue = getDaysUntilDue(dueDate);
    return daysUntilDue === 4; // 4 dias antes do vencimento
  };
  
  // Função para verificar se deve enviar cobrança no dia anterior (2 dias após)
  const shouldSendOverduePrevious = (dueDate: string): boolean => {
    const daysOverdue = getDaysOverdue(dueDate);
    return daysOverdue === 2; // 2 dias após o vencimento
  };
  
  // Upcoming invoices for reminders (3 days before due date)
  const upcomingInvoices = invoices.filter(invoice => 
    !invoice.isPaid && !isOverdue(invoice.dueDate) && shouldSendReminder(invoice.dueDate)
  );
  
  // Recently overdue invoices (1 day after due date)
  const recentlyOverdueInvoices = invoices.filter(invoice => 
    !invoice.isPaid && isOverdue(invoice.dueDate) && shouldSendOverdue(invoice.dueDate)
  );
  
  // Invoices from the previous day (4 days before due date)
  const previousReminderInvoices = invoices.filter(invoice => 
    !invoice.isPaid && !isOverdue(invoice.dueDate) && shouldSendReminderPrevious(invoice.dueDate)
  );
  
  // Invoices from the previous day (2 days after due date)
  const previousOverdueInvoices = invoices.filter(invoice => 
    !invoice.isPaid && isOverdue(invoice.dueDate) && shouldSendOverduePrevious(invoice.dueDate)
  );

  // Automated processing of messages
  const processAutomatedMessages = async () => {
    if (isProcessing) return;
    
    let invoicesToProcess = [...upcomingInvoices, ...recentlyOverdueInvoices];
    
    if (includePrevious) {
      invoicesToProcess = [...invoicesToProcess, ...previousReminderInvoices, ...previousOverdueInvoices];
    }
    
    if (invoicesToProcess.length === 0) {
      toast({
        title: "Nenhuma mensagem para enviar",
        description: "Não existem faturas para enviar lembretes ou cobranças agora."
      });
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    
    const totalToProcess = invoicesToProcess.length;
    let processed = 0;
    
    for (const invoice of invoicesToProcess) {
      try {
        const isReminder = upcomingInvoices.includes(invoice) || previousReminderInvoices.includes(invoice);
        const messageType = isReminder ? 'reminder' : 'overdue';
        
        // Select template based on message type
        const templateContent = isReminder 
          ? messageTemplates.reminder 
          : messageTemplates.overdue;
        
        // Prepare variables for template
        const variables = getMessageVariables(
          invoice, 
          !isReminder ? getDaysOverdue(invoice.dueDate) : undefined
        );
        
        // Format message with variables
        const messageContent = formatMessageWithVariables(templateContent, variables);
        
        // Send message using the API
        const response = await sendWhatsAppMessage(invoice.whatsappNumber, messageContent);
        
        // Record the message in history
        const message: Message = {
          id: uuidv4(),
          invoiceId: invoice.id,
          customerName: invoice.customerName,
          whatsappNumber: invoice.whatsappNumber,
          content: messageContent,
          sentAt: getCurrentDateISOString(),
          deliveryStatus: response.success ? 'sent' : 'failed',
          messageType: isReminder ? 'reminder' : 'overdue',
        };
        
        onAddMessage(message);
        
        processed++;
        setProgress(Math.floor((processed / totalToProcess) * 100));
        
        // Add a small delay between messages
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Error sending automated message:", error);
      }
    }
    
    toast({
      title: "Processamento concluído",
      description: `${processed} mensagens automatizadas foram processadas.`
    });
    
    setIsProcessing(false);
    setProgress(100);
  };

  const totalPendingMessages = upcomingInvoices.length + recentlyOverdueInvoices.length + 
    (includePrevious ? previousReminderInvoices.length + previousOverdueInvoices.length : 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center">
                <Badge className="bg-green-500 mr-1">{paidInvoices}</Badge>
                <span className="text-xs text-muted-foreground">Pagas</span>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="mr-1">{pendingInvoices}</Badge>
                <span className="text-xs text-muted-foreground">Pendentes</span>
              </div>
              <div className="flex items-center">
                <Badge variant="destructive" className="mr-1">{overdueInvoices}</Badge>
                <span className="text-xs text-muted-foreground">Atrasadas</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mr-1">{sentMessages}</Badge>
                <span className="text-xs text-muted-foreground">Enviadas</span>
              </div>
              <div className="flex items-center">
                <Badge variant="destructive" className="mr-1">{failedMessages}</Badge>
                <span className="text-xs text-muted-foreground">Falhas</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Automação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mr-1">
                  {upcomingInvoices.length + (includePrevious ? previousReminderInvoices.length : 0)}
                </Badge>
                <span className="text-xs text-muted-foreground">Lembretes</span>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 mr-1">
                  {recentlyOverdueInvoices.length + (includePrevious ? previousOverdueInvoices.length : 0)}
                </Badge>
                <span className="text-xs text-muted-foreground">Cobranças</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrevious}
                  onChange={(e) => setIncludePrevious(e.target.checked)}
                  className="rounded border-gray-300 text-primary"
                />
                Incluir dia anterior
              </label>
              <span className="text-xs text-muted-foreground">({previousReminderInvoices.length + previousOverdueInvoices.length})</span>
            </div>
            
            <Button 
              onClick={processAutomatedMessages}
              disabled={isProcessing || totalPendingMessages === 0}
              className="w-full mt-0 flex items-center gap-2"
            >
              <Send size={16} />
              {isProcessing ? "Processando..." : `Enviar ${totalPendingMessages} Mensagens`}
            </Button>
            
            {isProcessing && (
              <Progress value={progress} className="mt-2" />
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Mensagens Pendentes</CardTitle>
          <CardDescription>
            Faturas que necessitam envio de lembretes ou cobranças automatizadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="reminders">
            <TabsList className="mb-4">
              <TabsTrigger value="reminders">
                Lembretes ({upcomingInvoices.length + (includePrevious ? previousReminderInvoices.length : 0)})
              </TabsTrigger>
              <TabsTrigger value="collections">
                Cobranças ({recentlyOverdueInvoices.length + (includePrevious ? previousOverdueInvoices.length : 0)})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="reminders">
              {upcomingInvoices.length === 0 && (!includePrevious || previousReminderInvoices.length === 0) ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Não há lembretes para enviar.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>N° Pedido/NF</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Quando</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.customerName}</TableCell>
                          <TableCell>{invoice.orderNumber || "-"}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(invoice.amount)}
                          </TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Hoje
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {includePrevious && previousReminderInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.customerName}</TableCell>
                          <TableCell>{invoice.orderNumber || "-"}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(invoice.amount)}
                          </TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Dia Anterior
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="collections">
              {recentlyOverdueInvoices.length === 0 && (!includePrevious || previousOverdueInvoices.length === 0) ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Não há cobranças para enviar.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>N° Pedido/NF</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Dias em Atraso</TableHead>
                        <TableHead>Quando</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentlyOverdueInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.customerName}</TableCell>
                          <TableCell>{invoice.orderNumber || "-"}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(invoice.amount)}
                          </TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell>{getDaysOverdue(invoice.dueDate)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Hoje
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {includePrevious && previousOverdueInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.customerName}</TableCell>
                          <TableCell>{invoice.orderNumber || "-"}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(invoice.amount)}
                          </TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell>{getDaysOverdue(invoice.dueDate)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Dia Anterior
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Internal Table component for the Dashboard
const Table = ({ children }: { children: React.ReactNode }) => {
  return <table className="w-full">{children}</table>;
};

const TableHeader = ({ children }: { children: React.ReactNode }) => {
  return <thead>{children}</thead>;
};

const TableBody = ({ children }: { children: React.ReactNode }) => {
  return <tbody>{children}</tbody>;
};

const TableRow = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => {
  return <tr className={`border-b ${className || ""}`} {...props}>{children}</tr>;
};

const TableHead = ({ children }: { children: React.ReactNode }) => {
  return <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">{children}</th>;
};

const TableCell = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <td className={`p-4 align-middle ${className || ""}`}>{children}</td>;
};

export default Dashboard;
