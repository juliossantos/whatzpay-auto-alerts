
import { Message, WPPConnectResponse } from '../types';

// This is a mock implementation since we don't have actual API access
// In a real implementation, you would integrate with the WPPConnect API
export const sendWhatsAppMessage = async (
  whatsappNumber: string,
  message: string
): Promise<WPPConnectResponse> => {
  console.log(`Sending WhatsApp message to ${whatsappNumber}: ${message}`);
  
  // Simulating API call with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate success most of the time
      const success = Math.random() > 0.1;
      
      if (success) {
        resolve({
          success: true,
          status: 'sent',
          messageId: `msg_${Date.now()}`
        });
      } else {
        resolve({
          success: false,
          status: 'failed',
          error: 'Failed to send message'
        });
      }
    }, 1000);
  });
};

export const formatMessageWithVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  let formattedMessage = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    formattedMessage = formattedMessage.replace(regex, value);
  });
  
  return formattedMessage;
};

export const getMessageVariables = (
  invoiceData: {
    customerName: string;
    amount: number;
    dueDate: string;
    paymentLink?: string;
  },
  daysOverdue?: number
): Record<string, string> => {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return {
    nome: invoiceData.customerName,
    valor: formatter.format(invoiceData.amount),
    vencimento: new Date(invoiceData.dueDate).toLocaleDateString('pt-BR'),
    link: invoiceData.paymentLink || '#',
    diasAtraso: daysOverdue?.toString() || '0',
  };
};
