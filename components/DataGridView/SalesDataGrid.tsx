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
import { format, getQuarter, getWeek, isWeekend } from "date-fns";
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
}) {
  const [dataGridRows, setDataGridRows] = useState(rows);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  const computeTotalsByMonth = (rows) => {
    const totalsByMonth = {
      January: 0,
      February: 0,
      March: 0,
      April: 0,
      May: 0,
      June: 0,
      July: 0,
      August: 0,
      September: 0,
      October: 0,
      November: 0,
      December: 0,
    };

    rows.forEach((row) => {
      const date = new Date(row.date);
      const month = format(date, "MMMM");

      if (
        row.to_forecast_initial_weight !== null &&
        !isNaN(parseFloat(row.to_forecast_initial_weight))
      ) {
        totalsByMonth[month] += parseFloat(row.to_forecast_initial_weight);
      }
    });

    return totalsByMonth;
  };

  const updateRowsWithWeightedPercentage = (rows, totalsByMonth) => {
    rows.forEach((row) => {
      const date = new Date(row.date);
      const month = format(date, "MMMM");

      if (
        row.to_forecast_initial_weight !== null &&
        !isNaN(parseFloat(row.to_forecast_initial_weight))
      ) {
        const totalForMonth = totalsByMonth[month];
        if (totalForMonth !== 0) {
          row.to_forecast_final_weight =
            (
              (parseFloat(row.to_forecast_initial_weight) / totalForMonth) *
              100
            ).toFixed(2) + "%";
        } else {
          row.to_forecast_final_weight = "0%";
        }
      } else {
        row.to_forecast_final_weight = null;
      }
    });

    return rows;
  };

  const calculateMonthData = (rows) => {
    const monthData = {};

    rows.forEach((row) => {
      const date = new Date(row.date);
      const month = format(date, "MMMM");

      if (!monthData[month]) {
        monthData[month] = {
          turnover: 0,
          ff: 0,
          to_budget: 0,
          ff_budget: 0,
          to_forecast_initial_weight: 0,
        };
      }

      monthData[month].turnover += row.turnover || 0;
      monthData[month].ff += row.ff || 0;
      monthData[month].ff_budget += row.ff_budget || 0;
      monthData[month].to_forecast_initial_weight +=
        row.to_forecast_initial_weight || 0;
    });

    monthData["January"].to_budget = 12000000;
    monthData["February"].to_budget = 8000000;
    monthData["March"].to_budget = 9000000;
    monthData["April"].to_budget = 12000000;
    monthData["May"].to_budget = 12000000;
    monthData["June"].to_budget = 15000000;
    monthData["July"].to_budget = 16000000;
    monthData["August"].to_budget = 19000000;
    monthData["September"].to_budget = 12000000;
    monthData["October"].to_budget = 13000000;
    monthData["November"].to_budget = 17500000;
    monthData["December"].to_budget = 23000000;

    return monthData;
  };

  const calculateWeights = (row, monthData) => {
    const date = new Date(row.date);
    const month = format(date, "MMMM");

    const totalTurnover = monthData[month]?.turnover || 1;
    const totalFF = monthData[month]?.ff || 1;
    const totalToBudget = monthData[month]?.to_budget || 1;
    const totalFFBudget = monthData[month]?.ff_budget || 1;
    const totalToForecastInitialWeight =
      monthData[month]?.to_forecast_initial_weight || 1;

    const toWeightVsMonth =
      totalTurnover !== 0
        ? ((row.turnover / totalTurnover) * 100).toFixed(2) + "%"
        : "0%";

    const ffWeightVsMonth =
      totalFF !== 0 ? ((row.ff / totalFF) * 100).toFixed(2) + "%" : "0%";

    const toBudgetWeightVsMonth =
      totalToBudget !== 0
        ? ((row.to_budget / totalToBudget) * 100).toFixed(2) + "%"
        : "0%";

    const ffBudgetWeightVsMonth =
      totalFFBudget !== 0
        ? ((row.ff_budget / totalFFBudget) * 100).toFixed(2) + "%"
        : "0%";

    const toForecastInitialWeight =
      row.turnover > 0
        ? ((row.turnover / monthData[month].to_budget) * 100).toFixed(2)
        : 0;

    const toForecastFinalWeight =
      totalToForecastInitialWeight !== 0
        ? (
            (row.to_forecast_initial_weight / totalToForecastInitialWeight) *
            100
          ).toFixed(2) + "%"
        : "0%";

    return {
      to_weight_vs_month: toWeightVsMonth,
      ff_weight_vs_month: ffWeightVsMonth,
      to_budget_weight_vs_month: toBudgetWeightVsMonth,
      ff_budget_weight_vs_month: ffBudgetWeightVsMonth,
      to_forecast_initial_weight: toForecastInitialWeight,
      to_forecast_final_weight: toForecastFinalWeight,
    };
  };

  const calculateTotalToUpUntilDate = (rows, date) => {
    const targetDate = new Date(date);
    const targetMonth = targetDate.getMonth();

    const totalTurnover = rows
      .filter((entity) => new Date(entity.date) <= targetDate)
      .reduce((sum, entity) => sum + entity.turnover, 0);

    const totalTurnoverSameMonth = rows
      .filter((entity) => {
        const entityDate = new Date(entity.date);
        return entityDate.getMonth() === targetMonth;
      })
      .reduce((sum, entity) => sum + entity.turnover, 0);

    return { totalTurnover, totalTurnoverSameMonth };
  };

  useEffect(() => {
    const monthData = calculateMonthData(rows);

    let updatedRows = rows.map((row) => {
      const date = new Date(row.date);
      const month = format(date, "MMMM");
      const week = getWeek(date);
      const quarter = `Q${getQuarter(date)}`;
      const weekend = isWeekend(date);
      const weekday = format(date, "EEEE");

      const {
        to_weight_vs_month,
        ff_weight_vs_month,
        to_budget_weight_vs_month,
        ff_budget_weight_vs_month,
        to_forecast_initial_weight,
        to_forecast_final_weight,
      } = calculateWeights(row, monthData);

      const to_forecast_final_weight_number = parseFloat(
        to_forecast_final_weight.replace("%", "")
      );

      const targetDate = new Date(cutoffDate);
      targetDate.setDate(targetDate.getDate() + 1);

      return {
        ...row,
        month,
        week,
        quarter,
        weekend,
        weekday,
        to_weight_vs_month,
        to_budget_weight_vs_month,
        to_forecast_initial_weight:
          date <= targetDate ? to_forecast_initial_weight : 0,
        to_forecast_final_weight,
        to_forecast:
          date <= targetDate
            ? row.turnover
            : (
                (to_forecast_final_weight_number / 100) *
                monthData[`${month}`].to_budget
              ).toFixed(2),
        ff_weight_vs_month,
        ff_budget_weight_vs_month,
      };
    });
    const totalsByMonth = computeTotalsByMonth(updatedRows);
    updatedRows = updateRowsWithWeightedPercentage(updatedRows, totalsByMonth);
    setDataGridRows(updatedRows);
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

    const updatedRows = dataGridRows.map((row) =>
      row.id === newRow.id ? updatedRow : row
    );

    const totals = computeTotalsByMonth(dataGridRows);
    const monthData = calculateMonthData(updatedRows);
    const { totalTurnoverSameMonth, totalTurnover } =
      calculateTotalToUpUntilDate(rows, cutoffDate);

    const recalculatedRows = updatedRows.map((row) => {
      const date = new Date(row.date);
      const month = format(date, "MMMM");
      const week = getWeek(date);
      const quarter = `Q${getQuarter(date)}`;
      const weekend = isWeekend(date);
      const weekday = format(date, "EEEE");

      const {
        to_weight_vs_month,
        ff_weight_vs_month,
        to_forecast_final_weight,
      } = calculateWeights(row, monthData, totals[`${month}`]);

      const to_forecast_initial_weight_vs_month_number = parseFloat(
        to_forecast_final_weight.replace("%", "")
      );

      const targetDate = new Date(cutoffDate);
      targetDate.setDate(targetDate.getDate() + 1);

      return {
        ...row,
        month,
        week,
        quarter,
        weekend,
        weekday,
        to_weight_vs_month,
        ff_weight_vs_month,
        to_forecast_final_weight,
        to_forecast:
          date <= targetDate
            ? row.turnover
            : (
                (to_forecast_initial_weight_vs_month_number / 100) *
                (totalTurnoverSameMonth - totalTurnover)
              ).toFixed(2),
      };
    });

    setDataGridRows(recalculatedRows);
    return updatedRow;
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
      width: 50,
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
      width: 125,
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
      width: 100,
      editable: editable,
      align: "right",
      headerAlign: "center",
      valueFormatter: (params) => Intl.NumberFormat("en-US").format(params),
    },
    {
      field: "to_weight_vs_month",
      headerName: "TO Weight vs Month",
      width: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "to_budget",
      headerName: "TO Budget",
      width: 150,
      align: "right",
      headerAlign: "center",
      valueFormatter: (params) => Intl.NumberFormat("en-US").format(params),
    },
    {
      field: "to_budget_weight_vs_month",
      headerName: "TO Budget Weight vs Month",
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "to_forecast_initial_weight",
      headerName: "TO Forecast Initial Weight",
      width: 150,
      align: "right",
      headerAlign: "center",

      editable: editable,
      valueFormatter: (params) => (params ? `${params}%` : ""),
    },
    {
      field: "to_forecast_final_weight",
      headerName: "TO Forecast Final Weight",
      width: 150,
      align: "right",
      headerAlign: "center",
    },
    {
      field: "to_forecast",
      headerName: "TO Forecast",
      width: 150,
      align: "right",
      headerAlign: "center",

      valueFormatter: (params) => Intl.NumberFormat("en-US").format(params),
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
      width: 150,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "ff_budget",
      headerName: "FF Budget",
      width: 150,
      align: "right",
      headerAlign: "center",
    },
    {
      field: "ff_budget_weight_vs_month",
      headerName: "FF Budget Weight vs Month",
      width: 150,
      align: "center",
      headerAlign: "center",
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
      }}
      density="compact"
      editMode="row"
      rowModesModel={rowModesModel}
      onRowModesModelChange={handleRowModesModelChange}
      onRowEditStop={handleRowEditStop}
      processRowUpdate={processRowUpdate}
      getRowClassName={getRowClassName}
    />
  );
}
