export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const addLocalDays = (dateString, days) => {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return getLocalDateString(date);
};

export const isDateBeforeToday = (dateString) => {
  if (!dateString) return true;

  return dateString < getLocalDateString();
};

export const formatDateLong = (dateString) => {
  if (!dateString) return "Not selected";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
};

export const getDayLabel = (dateString, index = null) => {
  const today = getLocalDateString();
  const tomorrow = addLocalDays(today, 1);

  if (dateString === today) return "Today";
  if (dateString === tomorrow) return "Tomorrow";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
  });
};

export const getShortMonth = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
  });
};

export const getDayNumber = (dateString) => {
  const [, , day] = dateString.split("-");

  return day;
};

export const getNextSevenLocalDays = () => {
  const today = getLocalDateString();

  return Array.from({ length: 7 }, (_, index) => {
    const date = addLocalDays(today, index);

    return {
      date,
      label: getDayLabel(date, index),
      day: getDayNumber(date),
      month: getShortMonth(date),
    };
  });
};