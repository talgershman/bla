import {
  add,
  differenceInDays,
  endOfDay,
  format,
  isDate as isDateFns,
  parse,
  parseISO,
  startOfDay,
  startOfSecond,
  sub,
} from 'date-fns';

export const PERMANENT_DATE = '3000-01-01';

function convertToDateFns(date: string | Date): Date {
  if (isDateFns(date)) {
    return date as Date;
  }
  let parsedDate: Date;
  try {
    parsedDate = parseISO(date as string);
    // eslint-disable-next-line
  } catch (e) {
    parsedDate = new Date('invalid'); // keeps the old behavior once date is undefined
  }
  return parsedDate;
}

export const formatDateShort = (dateStr: string): string => {
  if (!dateStr) {
    return '';
  }
  const date = convertToDateFns(dateStr);
  return format(date, 'dd/MM/yyyy');
};

export const formatDateShortWithPermanent = (dateStr: string): string => {
  if (dateStr === PERMANENT_DATE) {
    return 'Permanent';
  }
  const formattedDate = formatDateShort(dateStr);
  return formattedDate;
};

export const formatDateFull = (dateStr: string): string => {
  if (!dateStr) {
    return '';
  }
  const date = convertToDateFns(dateStr);
  return format(date, 'dd/MM/yyyy, HH:mm:ss');
};

export const formatDateFullOrReturnBlank = (dateStr: string): string => {
  if (!dateStr) {
    return '';
  }
  const date = convertToDateFns(dateStr);
  return format(date, 'dd/MM/yyyy, HH:mm:ss');
};

export const toDateFns = (value: string, formatStr = 'dd-MM-yyyy'): Date => {
  return parse(value, formatStr, new Date());
};

export const endOfToday = (): Date => {
  return endOfDay(new Date());
};
export const startOfToday = (): Date => {
  return startOfDay(new Date());
};

export const startOfDayFns = (date: Date | string): Date => {
  let currentDate = date;
  if (typeof date === 'string') {
    currentDate = convertToDateFns(date);
  }
  return startOfDay(currentDate as Date);
};

export const compareDates = (first: string | Date, second: string | Date): boolean => {
  const firstDateFns: Date = convertToDateFns(first);
  const secondDateFns: Date = convertToDateFns(second);
  return firstDateFns < secondDateFns;
};

export const toLocalShortDate = (value: any): string => {
  const date = convertToDateFns(value);
  return format(date, 'dd-MM-yyyy');
};

export const toShortDate = (value: string | Date): string => {
  if (value === null) {
    return '';
  }
  const date = convertToDateFns(value);
  return format(date, 'yyyy-MM-dd');
};

export const isDate = (value: any): boolean => {
  return isDateFns(value);
};

export const dateNow = (): Date => {
  return new Date();
};

export const getDateFromNow = (
  amount: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years',
): Date => {
  let date = new Date();
  switch (unit) {
    case 'seconds':
      date = sub(date, {seconds: amount});
      break;
    case 'minutes':
      date = sub(date, {minutes: amount});
      break;
    case 'hours':
      date = sub(date, {hours: amount});
      break;
    case 'days':
      date = sub(date, {days: amount});
      break;
    case 'months':
      date = sub(date, {months: amount});
      break;
    case 'years':
      date = sub(date, {years: amount});
      break;
    default:
      break;
  }
  return startOfSecond(date);
};

export const getFutureDateFromNow = (
  amount: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years',
): Date => {
  let date = new Date();
  switch (unit) {
    case 'seconds':
      date = add(date, {seconds: amount});
      break;
    case 'minutes':
      date = add(date, {minutes: amount});
      break;
    case 'hours':
      date = add(date, {hours: amount});
      break;
    case 'days':
      date = add(date, {days: amount});
      break;
    case 'months':
      date = add(date, {months: amount});
      break;
    case 'years':
      date = add(date, {years: amount});
      break;
    default:
      break;
  }
  return startOfSecond(date);
};

export const dateDiff = (first: string | Date, second: string | Date): number => {
  const firstDateFns: Date = convertToDateFns(first);
  const secondDateFns: Date = convertToDateFns(second);
  return differenceInDays(firstDateFns, secondDateFns);
};

export const convertMomentToDateFns = (DateFnsDate: any): Date => {
  return parseISO(DateFnsDate.toISOString());
};

export const dateDiffDateFns = (first: Date, second: Date): number => {
  return dateDiff(first, second);
};

export const addDaysToDate = (date: string | Date, days: number): Date => {
  const dateDateFns: Date = convertToDateFns(date);
  return add(dateDateFns, {days});
};

const _padding = (time: number): string => {
  return time < 10 ? '0' : '';
};

export const secondsToTimeFormatter = (value: number): string => {
  if (!value) {
    return '--';
  }
  const hours = Math.floor(value / 60 / 60);
  const minutes = Math.floor(value / 60) % 60;
  const seconds = value % 60;
  return `${_padding(hours)}${hours}:${_padding(minutes)}${minutes}:${_padding(seconds)}${seconds}`;
};
