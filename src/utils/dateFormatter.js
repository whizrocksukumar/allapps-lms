export const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        // Use Intl.DateTimeFormat for consistent formatting
        // GB locale uses dd/mm/yyyy, we just swap / for -
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date).replace(/\//g, '-');
    } catch (error) {
        console.error('Date formatting error:', error);
        return dateString;
    }
};
