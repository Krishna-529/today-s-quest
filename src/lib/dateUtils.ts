import { toZonedTime, format as formatTz } from 'date-fns-tz';
import { format } from 'date-fns';

const IST_TIMEZONE = 'Asia/Kolkata';

export const getISTDate = () => {
  return toZonedTime(new Date(), IST_TIMEZONE);
};

export const getISTDateString = () => {
  return format(getISTDate(), 'yyyy-MM-dd');
};

export const formatDateInIST = (date: Date | string, formatString: string = 'PPP') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const istDate = toZonedTime(dateObj, IST_TIMEZONE);
  return format(istDate, formatString);
};

export const normalizeDate = (dateStr?: string) => {
  if (!dateStr) return null;
  return dateStr.split("T")[0];
};

// Convert a Date object to IST and return normalized date string (YYYY-MM-DD)
export const normalizeDateToIST = (date: Date) => {
  const istDate = toZonedTime(date, IST_TIMEZONE);
  return format(istDate, 'yyyy-MM-dd');
};
