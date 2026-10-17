export abstract class DateProviderPort {
  abstract now(): Date;
  abstract startOf(unit: 'day' | 'week' | 'month'): Date;
  abstract endOf(unit: 'day' | 'week' | 'month'): Date;
  abstract addDays(days: number): Date;
  abstract endOfDayWithOffset(days: number): Date;
  abstract format(date: Date, template: string): string;
  abstract isBefore(dateA: Date, dateB: Date): boolean;
  abstract isAfter(dateA: Date, dateB: Date): boolean;
}
