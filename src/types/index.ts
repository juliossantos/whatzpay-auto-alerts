
export interface Invoice {
  id: string;
  customerName: string;
  customerCode?: string;
  whatsappNumber: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paymentLink?: string;
  orderNumber?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  invoiceId: string;
  customerName: string;
  whatsappNumber: string;
  content: string;
  sentAt: string;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  messageType: 'reminder' | 'overdue' | 'manual';
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
