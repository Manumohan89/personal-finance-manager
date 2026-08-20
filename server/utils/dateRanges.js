// Helpers for building month/year date boundaries used across dashboard & reports.

const startOfMonth = (year, month) => new Date(year, month - 1, 1, 0, 0, 0, 0);
const endOfMonth = (year, month) => new Date(year, month, 0, 23, 59, 59, 999);
const startOfYear = (year) => new Date(year, 0, 1, 0, 0, 0, 0);
const endOfYear = (year) => new Date(year, 11, 31, 23, 59, 59, 999);

const previousMonth = (year, month) => {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
};

module.exports = { startOfMonth, endOfMonth, startOfYear, endOfYear, previousMonth };
