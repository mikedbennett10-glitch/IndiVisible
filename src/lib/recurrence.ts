import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns'

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number
  endDate?: string
  daysOfWeek?: number[] // 0=Sun, 1=Mon, ..., 6=Sat
}

export function encodeRecurrenceRule(rule: RecurrenceRule): string {
  return JSON.stringify(rule)
}

export function decodeRecurrenceRule(encoded: string | null): RecurrenceRule | null {
  if (!encoded) return null
  try {
    return JSON.parse(encoded) as RecurrenceRule
  } catch {
    return null
  }
}

export function getNextOccurrence(
  currentDueDate: string | null,
  rule: RecurrenceRule
): string {
  const baseDate = currentDueDate ? new Date(currentDueDate + 'T00:00:00') : new Date()

  switch (rule.frequency) {
    case 'daily':
      return format(addDays(baseDate, rule.interval), 'yyyy-MM-dd')
    case 'weekly':
      return format(addWeeks(baseDate, rule.interval), 'yyyy-MM-dd')
    case 'biweekly':
      return format(addWeeks(baseDate, 2 * rule.interval), 'yyyy-MM-dd')
    case 'monthly':
      return format(addMonths(baseDate, rule.interval), 'yyyy-MM-dd')
    case 'yearly':
      return format(addYears(baseDate, rule.interval), 'yyyy-MM-dd')
    default:
      return format(addDays(baseDate, 1), 'yyyy-MM-dd')
  }
}

export function getRecurrenceLabel(rule: RecurrenceRule): string {
  const { frequency, interval } = rule

  if (interval === 1) {
    switch (frequency) {
      case 'daily': return 'Every day'
      case 'weekly': return 'Every week'
      case 'biweekly': return 'Every 2 weeks'
      case 'monthly': return 'Every month'
      case 'yearly': return 'Every year'
    }
  }

  switch (frequency) {
    case 'daily': return `Every ${interval} days`
    case 'weekly': return `Every ${interval} weeks`
    case 'biweekly': return `Every ${interval * 2} weeks`
    case 'monthly': return `Every ${interval} months`
    case 'yearly': return `Every ${interval} years`
  }
}

export const RECURRENCE_PRESETS: { label: string; rule: RecurrenceRule }[] = [
  { label: 'Daily', rule: { frequency: 'daily', interval: 1 } },
  { label: 'Weekly', rule: { frequency: 'weekly', interval: 1 } },
  { label: 'Every 2 weeks', rule: { frequency: 'biweekly', interval: 1 } },
  { label: 'Monthly', rule: { frequency: 'monthly', interval: 1 } },
  { label: 'Yearly', rule: { frequency: 'yearly', interval: 1 } },
]
