export const formatDate = (date) => {
    // If the date is not passed or is invalid, return null
    if (!date) return null;

    // Check if the date is already a Date object, if not, convert it
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    // Ensure the date is valid
    if (isNaN(date)) return null;

    // Get day abbreviation (e.g., Mon)
    const day = date.toLocaleDateString("en-US", { weekday: "short" });

    // Get month abbreviation (e.g., Oct)
    const month = date.toLocaleDateString("en-US", { month: "short" });

    // Get day number (e.g., 16)
    const dayNumber = date.getDate();

    // Get full year (e.g., 2023)
    const year = date.getFullYear();

    // Get hours in 12-hour format
    let hours = date.getHours();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12; // Convert 24-hour format to 12-hour format

    // Get minutes and pad with leading zero if needed
    const minutes = date.getMinutes().toString().padStart(2, "0");

    // Combine all parts into the desired format
    const formattedDate = `${day} ${month} ${dayNumber} ${year} ${hours}:${minutes} ${ampm}`;

    return formattedDate;
};
