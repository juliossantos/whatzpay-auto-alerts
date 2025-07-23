
export interface Invoice {
  id: string;
  customerName: string;
  customerCode?: string;
  whatsappNumber?: string;
  email?: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paymentLink?: string;
  orderNumber?: string;
  createdAt: string;
  contactMethod: 'whatsapp' | 'email';
}

export interface Message {
  id: string;
  invoiceId: string;
  customerName: string;
  whatsappNumber?: string;
  email?: string;
  content: string;
  sentAt: string;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  messageType: 'reminder' | 'overdue' | 'manual';
  contactMethod: 'whatsapp' | 'email';
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'reminder' | 'overdue';
  content: string;
}

export interface WPPConnectResponse {
  success: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  messageId?: string;
  error?: string;
}

export interface EmailResponse {
  success: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  messageId?: string;
  error?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  skippedInvoices: {
    customerName: string;
    orderNumber?: string;
    amount: number;
  }[];
}
