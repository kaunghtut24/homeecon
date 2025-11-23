/**
 * Parses a date string in YYYY-MM-DD format and returns a Date object
 * representing that date in the LOCAL timezone, avoiding UTC shifts.
 * 
 * Example: "2023-11-01" -> Date(2023, 10, 1, 0, 0, 0) (Local Time)
 * 
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Date object
 */
export const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();

    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        // Month is 0-indexed in JS Date
        return new Date(year, month - 1, day);
    } catch (e) {
        console.error("Error parsing date:", dateStr, e);
        return new Date();
    }
};
