import { supabase } from "@/utils/supabase/client";
import { LinearProgress, styled } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridEventListener,
  GridRowEditStopReasons,
  GridRowModel,
  GridRowModesModel,
} from "@mui/x-data-grid";
import { format, getQuarter, getISOWeek, isWeekend } from "date-fns";
import { useEffect, useState } from "react";

const StyledDataGrid = styled(DataGrid)`
  .weekend-row {
    background-color: #fae3fa;
  }
  .cutoff-row {
    background-color: #90ee90;
  }
`;

export default function SalesDataGrid({
  rows,
  loading,
  editable,
  extended,
  cutoffDate,
  reportVersionId,
}) {
  const [dataGridRows, setDataGridRows] = useState(rows);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  const calculateMonthData = (rows) => {
    // Initialize monthData with hardcoded to_budget values
    const monthData = {
      January: {
        turnover: 0,
        ff: 0,
        to_budget: 12000000,
        ff_budget: 0,
        to_forecast_initial_weight: 0,
      },
      February: {
        turnover: 0,
        ff: 0,
        to_budget: 8000000,
        ff_budget: 0,
        to_forecast_initial_weight: 0,
      },
      March: {
        turnover: 0,
        ff: 0,
        to_budget: 9000000,
        ff_budget: 0,
        to_forecast_initial_weight: 0,
      },
      April: {
        turnover: 0,
        ff: 0,
        to_budget: 12000000,
        ff_budget: 0,
        to_forecast_initial_weight: 0,
      },
      May: {
        turnover: 0,
        ff: 0,
        to_budget: 12000000,
        ff_budget: 0,
        to_forecast_initial_weight: 0,
      },
      June: {
        turnover: 0,
        ff: 0,
        to_budget: 15000000,
        ff_budget: 0,
        to_forecast_initial_weight: 0,
      },
      July: {
        turnover: 0,
        ff: 0,
        to_budget: 16000000,
        ff_budget: 0,
        to_forecast_initial_weight: 0,
      },
      August: {
        turnover: 0,
        ff: 0,
        to_budget: 19000000,
        ff_budget: 0,
        to_forecast_initial_weight: 0,
      },
      September: {
        turnover: 0,
        ff: 0,
        to_budget: 12000000,
        ff_budget: 0,
        to_forecast_initial_weight: 0,
      },
      October: {
        turnover: 0,
        ff: 0,
        to_budget: 13000000,
        ff_budget: 0,
        to_forecast_initial_weight: 0,
      },
      November: {
        turnover: 0,
        ff: 0,
        to_budget: 17500000,
        ff_budget: 0,
        to_forecast_initial_weight: 0,
      },
      December: {
        turnover: 0,
        ff: 0,
        to_budget: 23000000,
        ff_budget: 0,
        to_forecast_initial_weight: 0,
      },
    };

    // Iterate over rows to accumulate values
    rows.forEach((row) => {
      const date = new Date(row.date);
      const month = format(date, "MMMM");

      monthData[month].turnover += row.turnover || 0;
      monthData[month].ff += row.ff || 0;
      monthData[month].ff_budget += row.ff_budget || 0;
      monthData[month].to_forecast_initial_weight +=
        row.to_forecast_initial_weight || 0;
    });

    return monthData;
  };

  const formatRowDates = (rows) => {
    rows = rows.map((row) => {
      const date = new Date(row.date);
      const month = format(date, "MMMM");
      const week = getISOWeek(date);
      const quarter = `Q${getQuarter(date)}`;
      const weekend = isWeekend(date);
      const weekday = format(date, "EEEE");

      return {
        ...row,
        month,
        week,
        quarter,
        weekend,
        weekday,
      };
    });

    return rows;
  };

  const calculateToWeightVsMonth = (rows) => {
    const monthData = calculateMonthData(rows);
    const updatedRows = rows.map((row) => {
      if (monthData[row.month] && monthData[row.month].turnover) {
        const to_weight_vs_month =
          (row.turnover / monthData[row.month].turnover) * 100;
        return {
          ...row,
          to_weight_vs_month,
        };
      } else {
        return {
          ...row,
          to_weight_vs_month: 0,
        };
      }
    });

    return updatedRows;
  };

  const calculateFFWeightVsMonth = (rows) => {
    const monthData = calculateMonthData(rows);
    const updatedRows = rows.map((row) => {
      if (monthData[row.month] && monthData[row.month].ff) {
        const ff_weight_vs_month = (row.ff / monthData[row.month].ff) * 100;
        return {
          ...row,
          ff_weight_vs_month,
        };
      } else {
        return {
          ...row,
          ff_weight_vs_month: null,
        };
      }
    });

    return updatedRows;
  };

  const calculateToBudgetWeightVsMonth = (rows) => {
    const monthData = calculateMonthData(rows);
    const updatedRows = rows.map((row) => {
      const month = row.month;
      const monthlyData = monthData[month];

      if (monthlyData && monthlyData.to_budget) {
        const to_budget_weight_vs_month =
          (row.to_budget / monthlyData.to_budget) * 100;
        return {
          ...row,
          to_budget_weight_vs_month,
        };
      } else {
        return {
          ...row,
          to_budget_weight_vs_month: null,
        };
      }
    });

    return updatedRows;
  };

  const calculateFFBudgetWeightVsMonth = (rows) => {
    const monthData = calculateMonthData(rows);
    const updatedRows = rows.map((row) => {
      const month = row.month;
      const monthlyData = monthData[month];

      if (monthlyData && monthlyData.ff_budget) {
        const ff_budget_weight_vs_month =
          (row.ff_budget / monthlyData.ff_budget) * 100;
        return {
          ...row,
          ff_budget_weight_vs_month,
        };
      } else {
        return {
          ...row,
          ff_budget_weight_vs_month: null,
        };
      }
    });

    return updatedRows;
  };

  const calculateToForecastInitialWeight = async (rows) => {
    const monthData = calculateMonthData(rows);
    const cutoff = new Date(cutoffDate);
    cutoff.setHours(0, 0, 0, 0); // Timezone offset

    const rowsToUpdate = [];
    const rowsToRetrieve = [];

    rows.forEach((row) => {
      const rowDate = new Date(row.date);
      rowDate.setHours(0, 0, 0, 0); // Timezone offset

      if (rowDate <= cutoff) {
        const month = row.month;
        const monthlyBudget = monthData[month].to_budget;
        const toForecastInitialWeight = (row.to_forecast / monthlyBudget) * 100;

        rowsToUpdate.push({
          id: row.id,
          report_id: row.report_id,
          report_version_id: row.report_version_id,
          date: row.date,
          event: row.event,
          turnover: row.turnover,
          ff: row.ff,
          to_budget: row.to_budget,
          ff_budget: row.ff_budget,
          to_forecast_initial_weight:
            Math.round(toForecastInitialWeight * 100) / 100,
        });
      } else {
        rowsToRetrieve.push(row.id);
      }
    });

    if (rowsToRetrieve.length > 0) {
      const { data, error } = await supabase
        .from("days")
        .select("id, to_forecast_initial_weight")
        .in("id", rowsToRetrieve);

      if (error) {
        console.error("Error retrieving data from Supabase:", error);
        return [];
      }

      const idToWeightMap = data.reduce((acc, item) => {
        acc[item.id] = Math.round(item.to_forecast_initial_weight * 100) / 100;
        return acc;
      }, {});

      rowsToUpdate.push(
        ...rowsToRetrieve.map((id) => {
          const row = rows.find((r) => r.id === id);
          return {
            id: row.id,
            report_id: row.report_id,
            report_version_id: row.report_version_id,
            date: row.date,
            event: row.event,
            turnover: row.turnover,
            ff: row.ff,
            to_budget: row.to_budget,
            ff_budget: row.ff_budget,
            to_forecast_initial_weight: idToWeightMap[id],
          };
        })
      );
    }

    if (rowsToUpdate.length > 0) {
      const { data, error } = await supabase.from("days").upsert(rowsToUpdate);

      if (error) {
        console.error("Error updating data in Supabase:", error);
        return [];
      }
    }

    return rows.map((row) => ({
      ...row,
      to_forecast_initial_weight:
        rowsToUpdate.find((updatedRow) => updatedRow.id === row.id)
          ?.to_forecast_initial_weight || row.to_forecast_initial_weight,
    }));
  };

  const calculateToForecastBeforeCutoffDate = (rows) => {
    const updatedRows = rows.map((row) => {
      const rowDate = new Date(row.date);
      const cutoff = new Date(cutoffDate);

      rowDate.setHours(0, 0, 0, 0); // Timezone offset

      if (rowDate <= cutoff) {
        return {
          ...row,
          to_forecast: row.turnover,
        };
      }
      return row;
    });

    return updatedRows;
  };

  const calculateToForecastFinalWeight = (rows) => {
    const monthData = calculateMonthData(rows);
    const updatedRows = rows.map((row) => {
      const monthlyTotalToForecastInitialWeight =
        monthData[row.month].to_forecast_initial_weight;

      if (monthlyTotalToForecastInitialWeight !== 0) {
        const toForecastFinalWeight =
          (row.to_forecast_initial_weight /
            monthlyTotalToForecastInitialWeight) *
          100;
        return {
          ...row,
          to_forecast_final_weight: toForecastFinalWeight,
        };
      } else {
        return {
          ...row,
          to_forecast_final_weight: 0,
        };
      }
    });

    return updatedRows;
  };

  const calculateToForecastAfterCutoffDate = (rows) => {
    const monthData = calculateMonthData(rows);
    const updatedRows = rows.map((row) => {
      const rowDate = new Date(row.date);
      const cutoff = new Date(cutoffDate);

      rowDate.setHours(0, 0, 0, 0); // Timezone offset
      if (rowDate > cutoff && row.to_forecast_final_weight) {
        const to_forecast =
          (row.to_forecast_final_weight / 100) * monthData[row.month].to_budget;
        return {
          ...row,
          to_forecast,
        };
      }
      return { ...row };
    });
    return updatedRows;
  };

  const calculateToVarByDay = async (rows) => {
    const { data: previousYearDays, error } = await supabase
      .from("days")
      .select("date, turnover")
      .eq("report_version_id", reportVersionId - 1)
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching previous year's days data:", error.message);
      return rows; // Return original rows if there's an error
    }

    // Map over rows and calculate to_var_day
    const updatedRows = rows.map((row) => {
      if (row.to_forecast && typeof row.to_forecast !== "number")
        return { ...row };
      const rowDate = new Date(row.date);
      const previousYearDate = new Date(rowDate);
      previousYearDate.setFullYear(previousYearDate.getFullYear() - 1);

      // Find complementary day in previous year's data
      const complementaryDayIndex = previousYearDays.findIndex((day) => {
        const dayDate = new Date(day.date);
        return (
          dayDate.getDate() === previousYearDate.getDate() &&
          dayDate.getMonth() === previousYearDate.getMonth() &&
          dayDate.getFullYear() === previousYearDate.getFullYear()
        );
      });

      let toVarDay = null;

      if (
        complementaryDayIndex !== -1 &&
        complementaryDayIndex + 1 < previousYearDays.length
      ) {
        const complementaryNextDay =
          previousYearDays[complementaryDayIndex + 1];

        if (complementaryNextDay) {
          const toForecast = row.to_forecast;
          const previousTurnover = complementaryNextDay.turnover;

          if (previousTurnover) {
            toVarDay = (toForecast / previousTurnover - 1) * 100;
          } else {
            toVarDay = null;
          }
        }
      }

      return {
        ...row,
        to_var_day: toVarDay,
      };
    });

    return updatedRows;
  };

  const calculateToVarByWeek = async (rows) => {
    // Fetch previous year's days data from Supabase
    const { data: previousYearDays, error } = await supabase
      .from("days")
      .select("date, turnover")
      .eq("report_version_id", reportVersionId - 1);

    if (error) {
      console.error("Error fetching previous year's days data:", error.message);
      return rows; // Return original rows if there's an error
    }

    // Group rows by week
    const groupByWeek = (data) => {
      return data.reduce((acc, row) => {
        const date = new Date(row.date);
        const year = date.getFullYear();
        const week = getISOWeek(date);
        const key = `${year}-W${week}`;

        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
        return acc;
      }, {});
    };

    const currentYearWeeks = groupByWeek(rows);
    const previousYearWeeks = groupByWeek(previousYearDays);

    // Calculate variance for each week
    const updatedRows = rows.map((row) => {
      const date = new Date(row.date);
      const year = date.getFullYear();
      const week = getISOWeek(date);
      const key = `${year}-W${week}`;
      const isMonday = date.getUTCDay() === 1;

      if (
        isMonday &&
        currentYearWeeks[key] &&
        previousYearWeeks[`${year - 1}-W${week}`]
      ) {
        const currentYearWeekTurnover = currentYearWeeks[key].reduce(
          (sum, r) => sum + r.to_forecast,
          0
        );
        const previousYearWeekTurnover = previousYearWeeks[
          `${year - 1}-W${week}`
        ].reduce((sum, r) => sum + r.turnover, 0);

        if (previousYearWeekTurnover !== 0) {
          const toVarWeek =
            ((currentYearWeekTurnover - previousYearWeekTurnover) /
              previousYearWeekTurnover) *
            100;
          return {
            ...row,
            to_var_week: toVarWeek,
          };
        }
      }

      return {
        ...row,
        to_var_week: null,
      };
    });

    return updatedRows;
  };

  // Init and calculate on initial rows change
  useEffect(() => {
    const processRows = async () => {
      let updatedRows = formatRowDates(rows);
      updatedRows = calculateToWeightVsMonth(updatedRows);
      updatedRows = calculateToBudgetWeightVsMonth(updatedRows);
      updatedRows = calculateToForecastBeforeCutoffDate(updatedRows);
      updatedRows = await calculateToForecastInitialWeight(updatedRows);
      updatedRows = calculateToForecastFinalWeight(updatedRows);
      updatedRows = calculateToForecastAfterCutoffDate(updatedRows);
      updatedRows = await calculateToVarByDay(updatedRows);
      updatedRows = await calculateToVarByWeek(updatedRows);
      updatedRows = calculateFFWeightVsMonth(updatedRows);
      updatedRows = calculateFFBudgetWeightVsMonth(updatedRows);
      setDataGridRows(updatedRows);
    };

    processRows();
  }, [rows]);

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const processRowUpdate = async (newRow: GridRowModel) => {
    newRow.turnover = parseInt(newRow.turnover);
    newRow.ff = parseInt(newRow.ff);
    newRow.to_forecast_initial_weight = parseInt(
      newRow.to_forecast_initial_weight
    );

    const updatedRow = { ...newRow, isNew: false };

    const { error } = await supabase
      .from("days")
      .update({
        event: newRow.event,
        turnover: newRow.turnover,
        to_budget: newRow.to_budget,
        ff: newRow.ff,
        ff_budget: newRow.ff_budget,
        to_forecast_initial_weight: newRow.to_forecast_initial_weight,
      })
      .eq("id", newRow.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const index = dataGridRows.findIndex((row) => row.id === newRow.id);
    if (index !== -1) {
      let updatedRows = [...dataGridRows];
      updatedRows[index] = updatedRow;
      updatedRows = await triggerRecalculations(updatedRows);
      setDataGridRows(updatedRows);
    }

    return updatedRow;
  };

  const triggerRecalculations = async (rows) => {
    let updatedRows = calculateToForecastBeforeCutoffDate(rows);
    updatedRows = await calculateToForecastInitialWeight(updatedRows);
    updatedRows = calculateToForecastFinalWeight(updatedRows);
    updatedRows = calculateToForecastAfterCutoffDate(updatedRows);
    updatedRows = await calculateToVarByDay(updatedRows);
    updatedRows = await calculateToVarByWeek(updatedRows);
    return updatedRows;
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const getRowClassName = (params) => {
    if (params.row.date == cutoffDate?.format("YYYY-MM-DD"))
      return "cutoff-row";
    return params.row.weekend ? "weekend-row" : "";
  };

  const columns: GridColDef[] = [
    {
      field: "quarter",
      headerName: "Quarter",
      width: 75,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "month",
      headerName: "Month",
      width: 75,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "week",
      headerName: "Week",
      width: 100,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "weekday",
      headerName: "Weekday",
      width: 100,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "event",
      headerName: "Event",
      width: 250,
      editable: editable,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "date",
      headerName: "Date",
      width: 100,
      headerAlign: "center",
      align: "center",
      valueGetter: (params) => format(new Date(params), "dd/MM/yyyy"),
    },
    {
      field: "turnover",
      headerName: "TO",
      width: 120,
      editable: editable,
      align: "right",
      headerAlign: "center",
      valueFormatter: (params) =>
        Intl.NumberFormat("en-US").format(Math.round(params)),
    },
    {
      field: "to_weight_vs_month",
      headerName: "TO Weight vs Month",
      width: 80,
      headerAlign: "center",
      align: "center",
      valueFormatter: (params) => {
        if (typeof params === "number") {
          return `${Math.round(params)}%`;
        } else return "";
      },
    },
    {
      field: "to_budget",
      headerName: "TO Budget",
      width: 100,
      align: "right",
      headerAlign: "center",
      valueFormatter: (params) =>
        Intl.NumberFormat("en-US").format(Math.round(params)),
    },
    {
      field: "to_budget_weight_vs_month",
      headerName: "TO Budget Weight vs Month",
      width: 80,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => {
        if (params == null) {
          return "";
        }
        return `${Math.round(params)}%`;
      },
    },
    {
      field: "to_forecast_initial_weight",
      headerName: "TO Forecast Initial Weight",
      width: 80,
      align: "center",
      headerAlign: "center",
      editable: editable,
      valueFormatter: (params) => {
        if (typeof params === "number") {
          return `${params.toFixed(2)}%`;
        } else {
          return "";
        }
      },
    },
    {
      field: "to_forecast_final_weight",
      headerName: "TO Forecast Final Weight",
      width: 80,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => {
        if (typeof params === "number") {
          return `${params.toFixed(2)}%`;
        } else return "";
      },
    },
    {
      field: "to_forecast",
      headerName: "TO Forecast",
      width: 100,
      align: "right",
      headerAlign: "center",
      valueFormatter: (params) =>
        params ? Intl.NumberFormat("en-US").format(Math.round(params)) : params,
    },
    {
      field: "to_var_day",
      headerName: "VAR by Day",
      width: 80,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => {
        if (typeof params === "number" && !isNaN(params)) {
          return `${Math.round(params)}%`;
        } else return "";
      },
    },
    {
      field: "to_var_week",
      headerName: "VAR by Week",
      width: 80,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => {
        if (typeof params === "number" && !isNaN(params)) {
          return `${Math.round(params)}%`;
        } else return "";
      },
    },
    {
      field: "ff",
      headerName: "FF",
      width: 75,
      editable: editable,
      align: "right",
      headerAlign: "center",
      valueFormatter: (params) => Intl.NumberFormat("en-US").format(params),
    },
    {
      field: "ff_weight_vs_month",
      headerName: "FF Weight vs Month",
      width: 100,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => {
        if (typeof params === "number" && params > 0) {
          return `${Math.round(params)}%`;
        } else return "";
      },
    },
    {
      field: "ff_budget",
      headerName: "FF Budget",
      width: 150,
      align: "right",
      headerAlign: "center",
      valueFormatter: (params) => Intl.NumberFormat("en-US").format(params),
    },
    {
      field: "ff_budget_weight_vs_month",
      headerName: "FF Budget Weight vs Month",
      width: 150,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => {
        if (typeof params === "number" && params > 0) {
          return `${Math.round(params)}%`;
        } else return "";
      },
    },
  ];

  if (loading) {
    return (
      <div className="w-1/3 mx-auto mt-10">
        <LinearProgress />
      </div>
    );
  }

  return (
    <StyledDataGrid
      rows={dataGridRows}
      columns={columns}
      columnVisibilityModel={{
        to_budget: extended,
        ff_budget: extended,
        to_budget_weight_vs_month: extended,
        ff_budget_weight_vs_month: extended,
        to_forecast_initial_weight: extended,
        to_forecast: extended,
        to_forecast_final_weight: extended,
        to_var_day: extended,
        to_var_week: extended,
      }}
      density="compact"
      rowHeight={30}
      autoHeight
      editMode="row"
      rowModesModel={rowModesModel}
      onRowModesModelChange={handleRowModesModelChange}
      onRowEditStop={handleRowEditStop}
      processRowUpdate={processRowUpdate}
      getRowClassName={getRowClassName}
      isCellEditable={(params) =>
        new Date(params.row.date) > new Date(cutoffDate)
      }
      sx={{
        "& .MuiDataGrid-columnHeaderTitle": {
          whiteSpace: "normal",
          lineHeight: "normal",
        },
        "& .MuiDataGrid-columnHeader": {
          height: "unset !important",
        },
        "& .MuiDataGrid-columnHeaders": {
          maxHeight: "168px !important",
        },
      }}
    />
  );
}
