// Format date to Vietnam timezone (UTC+7)
export const formatVietnamDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    // Add 7 hours for Vietnam timezone
    const vietnamDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    
    const hours = String(vietnamDate.getUTCHours()).padStart(2, '0');
    const minutes = String(vietnamDate.getUTCMinutes()).padStart(2, '0');
    const day = String(vietnamDate.getUTCDate()).padStart(2, '0');
    const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, '0');
    const year = vietnamDate.getUTCFullYear();
    
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
};
