
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Invoice, Message } from "@/types";
import { 
  getCurrentDateISOString,
  shouldSendReminder,
  shouldSendOverdue,
  getDaysOverdue
} from "@/utils/dateUtils";
import { 
  formatMessageWithVariables, 
  getMessageVariables, 
  sendWhatsAppMessage 
} from "@/utils/wppConnectApi";
import { 
  sendEmail, 
  formatEmailWithVariables, 
  getEmailSubject 
} from "@/utils/emailApi";
import { v4 as uuidv4 } from "uuid";

// Import the refactored components
import DashboardStats from "./dashboard/DashboardStats";
import AutomationCard from "./dashboard/AutomationCard";
import InvoiceTables from "./dashboard/InvoiceTables";

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

  // Helper function to check if invoice needs reminder 4 days before due date (previous day)
  const shouldSendReminderPrevious = (dueDate: string): boolean => {
    return getDaysUntilDue(dueDate) === 4;
  };
  
  // Helper function to check if invoice needs collection 2 days after due date (previous day)
  const shouldSendOverduePrevious = (dueDate: string): boolean => {
    return getDaysOverdue(dueDate) === 2;
  };
  
  // Filter invoices for automation
  const filterInvoicesForAutomation = () => {
    // Upcoming invoices for reminders (3 days before due date)
    const upcomingInvoices = invoices.filter(invoice => 
      !invoice.isPaid && !isOverdue(invoice.dueDate) && shouldSendReminder(invoice.dueDate) &&
      (invoice.whatsappNumber || invoice.email)
    );
    
    // Recently overdue invoices (1 day after due date)
    const recentlyOverdueInvoices = invoices.filter(invoice => 
      !invoice.isPaid && isOverdue(invoice.dueDate) && shouldSendOverdue(invoice.dueDate) &&
      (invoice.whatsappNumber || invoice.email)
    );
    
    // Invoices from the previous day (4 days before due date)
    const previousReminderInvoices = invoices.filter(invoice => 
      !invoice.isPaid && !isOverdue(invoice.dueDate) && shouldSendReminderPrevious(invoice.dueDate) &&
      (invoice.whatsappNumber || invoice.email)
    );
    
    // Invoices from the previous day (2 days after due date)
    const previousOverdueInvoices = invoices.filter(invoice => 
      !invoice.isPaid && isOverdue(invoice.dueDate) && shouldSendOverduePrevious(invoice.dueDate) &&
      (invoice.whatsappNumber || invoice.email)
    );

    let invoicesToProcess = [...upcomingInvoices, ...recentlyOverdueInvoices];
    
    if (includePrevious) {
      invoicesToProcess = [...invoicesToProcess, ...previousReminderInvoices, ...previousOverdueInvoices];
    }
    
    return invoicesToProcess;
  };

  // Automated processing of messages
  const processAutomatedMessages = async () => {
    if (isProcessing) return;
    
    const invoicesToProcess = filterInvoicesForAutomation();
    
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
        const isReminder = shouldSendReminder(invoice.dueDate) || shouldSendReminderPrevious(invoice.dueDate);
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
          messageType: isReminder ? 'reminder' : 'overdue',
          contactMethod: invoice.contactMethod,
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Statistics Cards */}
        <DashboardStats invoices={invoices} messages={messages} />
        
        {/* Automation Card */}
        <AutomationCard 
          invoices={invoices}
          isProcessing={isProcessing}
          progress={progress}
          includePrevious={includePrevious}
          setIncludePrevious={setIncludePrevious}
          onProcessMessages={processAutomatedMessages}
        />
      </div>
      
      {/* Pending Messages Table */}
      <InvoiceTables 
        invoices={invoices}
        includePrevious={includePrevious}
      />
    </div>
  );
};

// Import this at the top of the file
import { isOverdue, getDaysUntilDue } from "@/utils/dateUtils";

export default Dashboard;
