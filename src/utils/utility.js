const toFixedNumber = (number) => {
  return Number(number.toFixed(2));
};

const toISOStringDate = (date) => {
  return new Date(`${date}T00:00:00Z`).toISOString();
};

const getDurationDates = (duration) => {
  const today = new Date();
  let startDate = new Date(today);
  let endDate = new Date(today);

  switch (duration) {
    case "D1": // Today
      startDate = new Date(today.setHours(0, 0, 0, 0));
      break;
    case "D-1": // Previous day
      startDate = new Date(today.setDate(today.getDate() - 1));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "D7":
      startDate = new Date(today.setDate(today.getDate() - 7));
      break;
    case "D30":
      startDate = new Date(today.setDate(today.getDate() - 30));
      break;
    case "M3":
      startDate = new Date(today.setMonth(today.getMonth() - 3));
      break;
    case "M6":
      startDate = new Date(today.setMonth(today.getMonth() - 6));
      break;
    case "Y1":
      startDate = new Date(today.setFullYear(today.getFullYear() - 1));
      break;
    default:
      return null;
  }
  console.log(startDate.toISOString(), endDate.toISOString());
  return {
    $gte: startDate.toISOString(),
    $lte: endDate.toISOString(),
  };
};

module.exports = { toFixedNumber, toISOStringDate, getDurationDates };
