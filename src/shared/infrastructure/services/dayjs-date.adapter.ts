import { Injectable } from '@nestjs/common';
import { DateProviderPort } from '@/shared/application/ports/date-provider.port';
import dayjs from 'dayjs';

@Injectable()
export class DayjsDateAdapter implements DateProviderPort {
  now(): Date {
    return dayjs().toDate();
  }

  startOf(unit: 'day' | 'week' | 'month'): Date {
    return dayjs().startOf(unit).toDate();
  }

  endOf(unit: 'day' | 'week' | 'month'): Date {
    return dayjs().endOf(unit).toDate();
  }

  addDays(days: number): Date {
    return dayjs().add(days, 'day').toDate();
  }

  endOfDayWithOffset(days: number): Date {
    return dayjs().add(days, 'day').endOf('day').toDate();
  }

  format(date: Date, template: string): string {
    return dayjs(date).format(template);
  }

  isBefore(dateA: Date, dateB: Date): boolean {
    return dayjs(dateA).isBefore(dayjs(dateB));
  }

  isAfter(dateA: Date, dateB: Date): boolean {
    return dayjs(dateA).isAfter(dayjs(dateB));
  }
}
