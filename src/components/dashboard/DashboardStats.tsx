
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice, Message } from "@/types";

interface DashboardStatsProps {
  invoices: Invoice[];
  messages: Message[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ invoices, messages }) => {
  // Dashboard stats
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(invoice => invoice.isPaid).length;
  const pendingInvoices = invoices.filter(invoice => !invoice.isPaid).length;
  const overdueInvoices = invoices.filter(invoice => !invoice.isPaid && isOverdue(invoice.dueDate)).length;
  
  const totalMessages = messages.length;
  const sentMessages = messages.filter(message => 
    message.deliveryStatus === 'sent' || 
    message.deliveryStatus === 'delivered' || 
    message.deliveryStatus === 'read'
  ).length;
  const failedMessages = messages.filter(message => message.deliveryStatus === 'failed').length;

  return (
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
    </div>
  );
};

// Import this at the top of the file
import { isOverdue } from "@/utils/dateUtils";

export default DashboardStats;
