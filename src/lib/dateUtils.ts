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
