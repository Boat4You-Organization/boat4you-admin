import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/hr';
import isBetweenPlugin from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import timezone from 'dayjs/plugin/timezone';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';

import {
  DATE_FORMAT_BLOG,
  DATE_FORMAT_FULL,
  DATE_FORMAT_HR,
  DATE_FORMAT_LONG,
  DATE_FORMAT_LONG_WITHOUT_DAY,
  DATE_FORMAT_SHORT_WITHOUT_DAY,
  DATE_FORMAT_SHORT_WITHOUT_YEAR,
  DATE_FORMAT_WITHOUT_YEAR,
  TIME_FORMAT,
} from '@/config/date-time.config';
import i18n from '@/i18n/i18n';

dayjs.extend(isoWeek);
dayjs.extend(isBetweenPlugin);
dayjs.extend(updateLocale);
dayjs.extend(timezone);
dayjs.extend(utc);

dayjs.updateLocale('en', {
  weekStart: 1,
});

dayjs.updateLocale('hr', {
  weekStart: 1,
});

export default class DateTime {
  private static getLocale = () => i18n.language || 'en';

  public static now = () => dayjs().locale(DateTime.getLocale());

  public static date = (date: string) => dayjs(date).locale(DateTime.getLocale());

  public static day = (date: Dayjs) => date.day();

  public static addWeek = (date: Dayjs) => date.add(1, 'week');

  public static subtractWeek = (date: Dayjs) => date.subtract(1, 'week');

  public static startOfWeek = (date: Dayjs) => date.startOf('isoWeek').format(DATE_FORMAT_FULL);

  public static endOfWeek = (date: Dayjs) => date.endOf('isoWeek').format(DATE_FORMAT_FULL);

  public static isInSameWeek = (dayA: Dayjs, dayB: Dayjs | null | undefined) => {
    if (dayB == null) {
      return false;
    }

    return dayA.isSame(dayB, 'week');
  };

  public static isToday = (date: Dayjs) => dayjs().isSame(date, 'day');

  public static formatFull = (date: Dayjs) => date.format(DATE_FORMAT_FULL);

  public static formatHR = (date: Dayjs) => date.locale(DateTime.getLocale()).format(DATE_FORMAT_HR);

  public static formatWithoutYear = (date: Dayjs) => date.locale(DateTime.getLocale()).format(DATE_FORMAT_WITHOUT_YEAR);

  public static formatShortWithoutYear = (date: Dayjs) =>
    date.locale(DateTime.getLocale()).format(DATE_FORMAT_SHORT_WITHOUT_YEAR);

  public static formatLong = (date: Dayjs) => {
    const formatted = date.locale(DateTime.getLocale()).format(DATE_FORMAT_LONG);

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  public static formatLongWithoutDay = (date: Dayjs) =>
    date.locale(DateTime.getLocale()).format(DATE_FORMAT_LONG_WITHOUT_DAY);

  public static formatShortWithoutDay = (date: Dayjs) =>
    date.locale(DateTime.getLocale()).format(DATE_FORMAT_SHORT_WITHOUT_DAY);

  public static formatDayForBlog = (date: Dayjs) => date.locale(DateTime.getLocale()).format(DATE_FORMAT_BLOG);

  public static formatTime = (date: Dayjs) => date.format(TIME_FORMAT);

  public static startOfYear = (date: Dayjs) => date.startOf('year').format(DATE_FORMAT_FULL);

  public static endOfYear = (date: Dayjs) => date.endOf('year').format(DATE_FORMAT_FULL);

  public static startOfMonth = (date: Dayjs) => date.startOf('month').format(DATE_FORMAT_FULL);

  public static endOfMonth = (date: Dayjs) => date.endOf('month').format(DATE_FORMAT_FULL);

  public static subtractTime({ days = 0, hours = 0 }) {
    let result = dayjs();

    if (days) result = result.subtract(days, 'day');

    if (hours) result = result.subtract(hours, 'hour');

    return result.format();
  }

  public static timeAgo = (time: string, date: string) => {
    const backendDateTime = dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', 'Europe/Zagreb');

    const userTimezone = dayjs.tz.guess();

    const localDateTime = backendDateTime.tz(userTimezone);

    const now = dayjs().tz(userTimezone);

    const diffInMinutes = now.diff(localDateTime, 'minute');

    if (diffInMinutes < 1) return 'Just now';

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;

    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  public static daysBetween = (startDate: Dayjs | null, endDate: Dayjs | null): number => {
    if (!startDate || !endDate) {
      return 0;
    }

    return endDate.startOf('day').diff(startDate.startOf('day'), 'day');
  };

  public static calculatePrice = (startDate: Dayjs | null, endDate: Dayjs | null, dailyPrice: number): number => {
    if (!startDate || !endDate || dailyPrice <= 0) {
      return 0;
    }

    const days = Math.max(1, endDate.startOf('day').diff(startDate.startOf('day'), 'day'));
    const totalPrice = days * dailyPrice;

    return parseFloat(totalPrice.toFixed(2));
  };
}
