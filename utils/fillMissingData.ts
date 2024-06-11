import { format, getDay, getQuarter, getWeek, parse } from "date-fns";
import { supabase } from "./supabase/client";

export const fillMissingData = (data: any) => {
  const processRow = (row) => {
    const date = parse(row.DATE, "M/d/yyyy", new Date());

    const weekend = getDay(date) === 0 || getDay(date) === 6;
    const month = format(date, "MMMM");
    const week = getWeek(date);
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

const reportId = 6; // example report ID
const reportYearId = 13; // example report year ID
const reportVersionId = 13; // example report version ID

async function insertData(data) {
  for (const entry of data.VCPFO) {
    const {
      DATE,
      EVENT,
      TURNOVER,
      TO_WEIGHT_vs_MONTH,
      FF,
      FF_WEIGHT_vs_MONTH,
      WEEKEND,
      MONTH,
      WEEK,
      WEEKDAY,
      QUARTER,
    } = entry;
    const weekend = WEEKEND ? true : false;

    const { error } = await supabase.from("days").insert([
      {
        report_id: reportId,
        report_year_id: reportYearId,
        report_version_id: reportVersionId,
        date: DATE,
        event: EVENT,
        turnover: TURNOVER,
        to_weight_vs_month: TO_WEIGHT_vs_MONTH,
        ff: FF,
        ff_weight_vs_month: FF_WEIGHT_vs_MONTH,
        weekend: weekend,
        month: MONTH,
        week: WEEK,
        weekday: WEEKDAY,
        quarter: QUARTER,
      },
    ]);

    if (error) {
      console.error("Error inserting data:", error);
      break;
    }
  }
  console.log("Data inserted successfully");
}
