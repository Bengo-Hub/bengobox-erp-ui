// formatters.js
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES'
    }).format(amount);
}

//format date
export function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

export function formatDateTime(date) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(date).toLocaleString('en-US', options);
}

export function formatTime(time) {
    return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Format date for API calls (YYYY-MM-DD format)
export function formatDateForAPI(date) {
    if (!date) return null;
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

// Format month selection for API calls (first day of selected month)
// This function properly handles month selection without timezone issues
export function formatMonthForAPI(monthDate) {
    if (!monthDate) return null;

    // Create a new date object from the selected month
    const dateObj = new Date(monthDate);

    // Extract year and month, then create a new date for the first day of that month
    // This avoids timezone conversion issues
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth(); // getMonth() returns 0-11

    // Create date in local timezone to avoid timezone shifts
    const firstDayOfMonth = new Date(year, month, 1);

    // Format as YYYY-MM-DD
    const yearStr = firstDayOfMonth.getFullYear();
    const monthStr = String(firstDayOfMonth.getMonth() + 1).padStart(2, '0'); // +1 because getMonth() is 0-based
    const dayStr = String(firstDayOfMonth.getDate()).padStart(2, '0');

    return `${yearStr}-${monthStr}-${dayStr}`;
}

// Get the last day of the month for a given date
export function getLastDayOfMonth(monthDate) {
    if (!monthDate) return null;

    // Create a new date object from the selected month
    const dateObj = new Date(monthDate);

    // Extract year and month
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth(); // getMonth() returns 0-11

    // Create date for the first day of the next month, then subtract 1 day
    const firstDayOfNextMonth = new Date(year, month + 1, 1);
    const lastDayOfMonth = new Date(firstDayOfNextMonth.getTime() - 24 * 60 * 60 * 1000);

    // Format as YYYY-MM-DD
    const yearStr = lastDayOfMonth.getFullYear();
    const monthStr = String(lastDayOfMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(lastDayOfMonth.getDate()).padStart(2, '0');

    return `${yearStr}-${monthStr}-${dayStr}`;
}

// Get both first and last day of the month for payroll period
export function getMonthDateRange(monthDate) {
    if (!monthDate) return { fromdate: null, todate: null };

    return {
        fromdate: formatMonthForAPI(monthDate),
        todate: getLastDayOfMonth(monthDate)
    };
}
