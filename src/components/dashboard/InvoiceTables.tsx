
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Invoice } from "@/types";
import { 
  formatDate, 
  getDaysOverdue, 
  getDaysUntilDue,
  shouldSendReminder,
  shouldSendOverdue
} from "@/utils/dateUtils";

interface InvoiceTablesProps {
  invoices: Invoice[];
  includePrevious: boolean;
}

// Internal Table components
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

const InvoiceTables: React.FC<InvoiceTablesProps> = ({ invoices, includePrevious }) => {
  // Function to verify if should send reminder on the previous day (4 days before)
  const shouldSendReminderPrevious = (dueDate: string): boolean => {
    const daysUntilDue = getDaysUntilDue(dueDate);
    return daysUntilDue === 4; // 4 days before due date
  };
  
  // Function to verify if should send collection on the previous day (2 days after)
  const shouldSendOverduePrevious = (dueDate: string): boolean => {
    const daysOverdue = getDaysOverdue(dueDate);
    return daysOverdue === 2; // 2 days after due date
  };
  
  // Upcoming invoices for reminders (3 days before due date)
  const upcomingInvoices = invoices.filter(invoice => 
    !invoice.isPaid && shouldSendReminder(invoice.dueDate)
  );
  
  // Recently overdue invoices (1 day after due date)
  const recentlyOverdueInvoices = invoices.filter(invoice => 
    !invoice.isPaid && shouldSendOverdue(invoice.dueDate)
  );
  
  // Invoices from the previous day (4 days before due date)
  const previousReminderInvoices = invoices.filter(invoice => 
    !invoice.isPaid && shouldSendReminderPrevious(invoice.dueDate)
  );
  
  // Invoices from the previous day (2 days after due date)
  const previousOverdueInvoices = invoices.filter(invoice => 
    !invoice.isPaid && shouldSendOverduePrevious(invoice.dueDate)
  );

  return (
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
  );
};

export default InvoiceTables;
