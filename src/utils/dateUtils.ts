
import { format, addDays, isAfter, differenceInDays } from 'date-fns';

// Função auxiliar para criar uma data sem problemas de timezone
const createSafeDate = (dateString: string): Date => {
  // Extrair a data no formato YYYY-MM-DD
  const parts = dateString.split('T')[0].split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Meses em JavaScript são 0-11
  const day = parseInt(parts[2]);
  
  // Criar a data usando UTC para evitar problemas de timezone
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
};

export const formatDate = (dateString: string): string => {
  const date = createSafeDate(dateString);
  return format(date, 'dd/MM/yyyy');
};

export const formatDatetime = (dateString: string): string => {
  const date = createSafeDate(dateString);
  return format(date, 'dd/MM/yyyy HH:mm');
};

export const isOverdue = (dueDate: string): boolean => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  const dueDateObj = createSafeDate(dueDate);
  
  return isAfter(today, dueDateObj);
};

export const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  const dueDateObj = createSafeDate(dueDate);
  
  return differenceInDays(dueDateObj, today);
};

export const getDaysOverdue = (dueDate: string): number => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  const dueDateObj = createSafeDate(dueDate);
  
  return differenceInDays(today, dueDateObj);
};

export const getDateForReminder = (dueDate: string): string => {
  const dueDateObj = createSafeDate(dueDate);
  const reminderDate = addDays(dueDateObj, -3);
  return format(reminderDate, 'yyyy-MM-dd');
};

// Função corrigida para verificar lembretes 3 dias antes do vencimento
export const shouldSendReminder = (dueDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Início do dia
  
  const dueDateObj = createSafeDate(dueDate);
  const daysUntilDue = getDaysUntilDue(dueDate);
  
  // Verificar se faltam exatamente 3 dias para o vencimento
  return daysUntilDue === 3;
};

// Função corrigida para verificar cobranças 1 dia após o vencimento
export const shouldSendOverdue = (dueDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Início do dia
  
  const dueDateObj = createSafeDate(dueDate);
  const daysOverdue = getDaysOverdue(dueDate);
  
  // Verificar se está exatamente 1 dia em atraso
  return daysOverdue === 1;
};

export const getCurrentDateISOString = (): string => {
  const now = new Date();
  
  // Formato YYYY-MM-DD para garantir consistência
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}T12:00:00.000Z`;
};
