import { format, getDay, getISOWeek, getQuarter, parse } from "date-fns";

export const fillMissingData = (data: any) => {
  const processRow = (row) => {
    const date = parse(row.DATE, "M/d/yyyy", new Date());

    const weekend = getDay(date) === 0 || getDay(date) === 6;
    const month = format(date, "MMMM");
    const week = getISOWeek(date);
    const weekday = format(date, "EEEE");
    const quarter = getQuarter(date);

    return {
      ...row,
      WEEKEND: weekend ? "Weekend" : "",
      MONTH: month,
      WEEK: week,
      WEEKDAY: weekday,
      QUARTER: `Q${quarter}`,
    };
  };

  Object.keys(data).forEach((key) => {
    data[key] = data[key].map(processRow);
  });

  // insertData(data);

  return data;
};
