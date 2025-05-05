
import { format, addDays, isAfter, differenceInDays, parseISO } from 'date-fns';

export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'dd/MM/yyyy');
};

export const formatDatetime = (dateString: string): string => {
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
};

export const isOverdue = (dueDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parse the date without adding/subtracting days to preserve the exact date
  const dueDateObj = parseISO(dueDate);
  dueDateObj.setHours(0, 0, 0, 0);
  
  return isAfter(today, dueDateObj);
};

export const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parse the date without adding/subtracting days to preserve the exact date
  const dueDateObj = parseISO(dueDate);
  dueDateObj.setHours(0, 0, 0, 0);
  
  return differenceInDays(dueDateObj, today);
};

export const getDaysOverdue = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parse the date without adding/subtracting days to preserve the exact date
  const dueDateObj = parseISO(dueDate);
  dueDateObj.setHours(0, 0, 0, 0);
  
  return differenceInDays(today, dueDateObj);
};

export const getDateForReminder = (dueDate: string): string => {
  // Parse the date without adding/subtracting days to preserve the exact date
  const dueDateObj = parseISO(dueDate);
  const reminderDate = addDays(dueDateObj, -3);
  return format(reminderDate, 'yyyy-MM-dd');
};

export const shouldSendReminder = (dueDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDateObj = parseISO(dueDate);
  const reminderDate = addDays(dueDateObj, -3);
  reminderDate.setHours(0, 0, 0, 0);
  
  return today.getTime() === reminderDate.getTime();
};

export const shouldSendOverdue = (dueDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDateObj = parseISO(dueDate);
  const overdueDate = addDays(dueDateObj, 1);
  overdueDate.setHours(0, 0, 0, 0);
  
  return today.getTime() === overdueDate.getTime();
};

export const getCurrentDateISOString = (): string => {
  return new Date().toISOString();
};
