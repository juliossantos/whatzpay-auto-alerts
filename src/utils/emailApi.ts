import { EmailResponse } from '../types';

// This is a mock implementation for email sending
// In a real implementation, you would integrate with an email service like EmailJS, SendGrid, etc.
export const sendEmail = async (
  to: string,
  subject: string,
  message: string
): Promise<EmailResponse> => {
  console.log(`Sending email to ${to}:`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: ${message}`);
  
  // Simulating API call with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate success most of the time
      const success = Math.random() > 0.1;
      
      if (success) {
        resolve({
          success: true,
          status: 'sent',
          messageId: `email_${Date.now()}`
        });
      } else {
        resolve({
          success: false,
          status: 'failed',
          error: 'Failed to send email'
        });
      }
    }, 1000);
  });
};

export const formatEmailWithVariables = (
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

export const getEmailSubject = (messageType: 'reminder' | 'overdue', customerName: string): string => {
  if (messageType === 'reminder') {
    return `Lembrete de Pagamento - ${customerName}`;
  } else {
    return `Cobrança - Pagamento em Atraso - ${customerName}`;
  }
};