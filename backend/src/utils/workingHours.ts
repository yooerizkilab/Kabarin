import { addMinutes, parse, format, isBefore, isAfter, startOfDay, addDays } from 'date-fns';

/**
 * Calculates the next available timestamp for sending a message based on user's working hours.
 * @param now Current date
 * @param startStr Start time (HH:mm)
 * @param endStr End time (HH:mm)
 * @returns Date The next available date (now if within hours, or next start time)
 */
export function getNextWorkingTime(now: Date, startStr: string, endStr: string): Date {
    const today = startOfDay(now);

    const startTimeSet = parse(startStr, 'HH:mm', today);
    const endTimeSet = parse(endStr, 'HH:mm', today);

    // If currently within hours, return now
    if (isAfter(now, startTimeSet) && isBefore(now, endTimeSet)) {
        return now;
    }

    // If before opening, return today's opening
    if (isBefore(now, startTimeSet)) {
        return startTimeSet;
    }

    // If after closing, return tomorrow's opening
    return addDays(startTimeSet, 1);
}

/**
 * Higher level helper for controller
 */
export function calculateDelay(scheduledAt: Date | null, user: any): number {
    let targetDate = scheduledAt || new Date();

    if (user.workingHoursEnabled && user.workingHoursStart && user.workingHoursEnd) {
        // Note: For now we use the system time for the "now" comparison.
        // In a real localized app, we'd adjust 'now' based on user.timezone.
        targetDate = getNextWorkingTime(targetDate, user.workingHoursStart, user.workingHoursEnd);
    }

    const delay = targetDate.getTime() - Date.now();
    return Math.max(0, delay);
}
