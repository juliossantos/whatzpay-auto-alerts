
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Send } from "lucide-react";
import { Invoice } from "@/types";
import { 
  isOverdue, 
  shouldSendReminder, 
  shouldSendOverdue, 
  getDaysOverdue,
  getDaysUntilDue
} from "@/utils/dateUtils";

interface AutomationCardProps {
  invoices: Invoice[];
  isProcessing: boolean;
  progress: number;
  includePrevious: boolean;
  setIncludePrevious: (include: boolean) => void;
  onProcessMessages: () => void;
}

const AutomationCard: React.FC<AutomationCardProps> = ({
  invoices,
  isProcessing,
  progress,
  includePrevious,
  setIncludePrevious,
  onProcessMessages
}) => {
  // Functions to verify if should send reminder/collection on the previous day
  const shouldSendReminderPrevious = (dueDate: string): boolean => {
    const daysUntilDue = getDaysUntilDue(dueDate);
    return daysUntilDue === 4; // 4 days before due date
  };
  
  const shouldSendOverduePrevious = (dueDate: string): boolean => {
    const daysOverdue = getDaysOverdue(dueDate);
    return daysOverdue === 2; // 2 days after due date
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

  const totalPendingMessages = upcomingInvoices.length + recentlyOverdueInvoices.length + 
    (includePrevious ? previousReminderInvoices.length + previousOverdueInvoices.length : 0);

  return (
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
          onClick={onProcessMessages}
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
  );
};

export default AutomationCard;
