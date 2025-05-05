
import { format, addDays, isAfter, differenceInDays, parseISO } from 'date-fns';

export const formatDate = (dateString: string): string => {
  // Create a date object and set time to noon to avoid timezone issues
  const date = new Date(dateString);
  date.setHours(12, 0, 0, 0);
  return format(date, 'dd/MM/yyyy');
};

export const formatDatetime = (dateString: string): string => {
  // Create a date object and set time to noon to avoid timezone issues
  const date = new Date(dateString);
  date.setHours(12, 0, 0, 0);
  return format(date, 'dd/MM/yyyy HH:mm');
};

export const isOverdue = (dueDate: string): boolean => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  // Parse the date and set time to noon to avoid timezone issues
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(12, 0, 0, 0);
  
  return isAfter(today, dueDateObj);
};

export const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  // Parse the date and set time to noon to avoid timezone issues
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(12, 0, 0, 0);
  
  return differenceInDays(dueDateObj, today);
};

export const getDaysOverdue = (dueDate: string): number => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  // Parse the date and set time to noon to avoid timezone issues
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(12, 0, 0, 0);
  
  return differenceInDays(today, dueDateObj);
};

export const getDateForReminder = (dueDate: string): string => {
  // Parse the date and set time to noon to avoid timezone issues
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(12, 0, 0, 0);
  const reminderDate = addDays(dueDateObj, -3);
  return format(reminderDate, 'yyyy-MM-dd');
};

export const shouldSendReminder = (dueDate: string): boolean => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  // Parse the date and set time to noon to avoid timezone issues
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(12, 0, 0, 0);
  const reminderDate = addDays(dueDateObj, -3);
  reminderDate.setHours(12, 0, 0, 0);
  
  // Compare just the date parts
  return today.toDateString() === reminderDate.toDateString();
};

export const shouldSendOverdue = (dueDate: string): boolean => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  
  // Parse the date and set time to noon to avoid timezone issues
  const dueDateObj = new Date(dueDate);
  dueDateObj.setHours(12, 0, 0, 0);
  const overdueDate = addDays(dueDateObj, 1);
  overdueDate.setHours(12, 0, 0, 0);
  
  // Compare just the date parts
  return today.toDateString() === overdueDate.toDateString();
};

export const getCurrentDateISOString = (): string => {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return now.toISOString();
};
