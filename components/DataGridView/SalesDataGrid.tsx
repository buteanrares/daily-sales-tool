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
import { format, getWeek, getMonth, getQuarter, isWeekend } from "date-fns";
import { useState } from "react";

const StyledDataGrid = styled(DataGrid)`
  .weekend-row {
    background-color: #fae3fa;
  }
`;

export default function SalesDataGrid({ rows, loading, editable }) {
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  const handleRowEditStop: GridEventListener<"rowEditStop"> = (
    params,
    event
  ) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const processRowUpdate = async (newRow: GridRowModel) => {
    const updatedRow = { ...newRow, isNew: false };
    const { error } = await supabase
      .from("days")
      .update(newRow)
      .eq("id", newRow.id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const getRowClassName = (params) => {
    return params.row.weekend ? "weekend-row" : "";
  };

  const monthData = {};

  rows.forEach((row) => {
    const date = new Date(row.date);
    const month = format(date, "MMMM");

    if (!monthData[month]) {
      monthData[month] = { turnover: 0, ff: 0 };
    }

    monthData[month].turnover += row.turnover;
    monthData[month].ff += row.ff;
  });

  const modifiedRows = rows.map((row) => {
    const date = new Date(row.date);
    const month = format(date, "MMMM");
    const week = getWeek(date) + 1;
    const quarter = `Q${getQuarter(date)}`;
    const weekend = isWeekend(date);
    const weekday = format(date, "EEEE");

    const totalTurnover = monthData[month].turnover;
    const toWeightVsMonth =
      totalTurnover !== 0
        ? ((row.turnover / totalTurnover) * 100).toFixed(2) + "%"
        : "0%";

    const totalFF = monthData[month].ff;
    const ffWeightVsMonth =
      totalFF !== 0 ? ((row.ff / totalFF) * 100).toFixed(2) + "%" : "0%";

    return {
      ...row,
      month,
      week,
      quarter,
      weekend,
      weekday,
      to_weight_vs_month: toWeightVsMonth,
      ff_weight_vs_month: ffWeightVsMonth,
    };
  });

  console.log(modifiedRows);

  const columns: GridColDef[] = [
    { field: "quarter", headerName: "Quarter", width: 75 },
    { field: "month", headerName: "Month", width: 100 },
    { field: "week", headerName: "Week", width: 75 },
    {
      field: "weekend",
      headerName: "Weekend",
      width: 100,
      renderCell: (params) => (params.value ? "Weekend" : ""),
    },
    { field: "weekday", headerName: "Weekday", width: 100 },
    { field: "event", headerName: "Event", width: 150, editable: editable },
    {
      field: "date",
      headerName: "Date",
      width: 100,
      editable: editable,
      valueGetter: (params) => format(params, "dd/MM/yyyy"),
    },
    {
      field: "turnover",
      headerName: "TO",
      width: 75,
      editable: editable,
      align: "right",
      headerAlign: "center",
      valueFormatter: (value) => Intl.NumberFormat("en-US").format(value),
    },
    {
      field: "to_weight_vs_month",
      headerName: "TO Weight vs Month",
      width: 150,
      align: "center",
    },
    {
      field: "to_budget",
      headerName: "TO Budget",
      width: 150,
      align: "right",
    },
    {
      field: "ff",
      headerName: "FF",
      width: 75,
      editable: editable,
      align: "right",
      headerAlign: "center",
      valueFormatter: (value) => Intl.NumberFormat("en-US").format(value),
    },
    {
      field: "ff_weight_vs_month",
      headerName: "FF Weight vs Month",
      width: 150,
      align: "center",
    },
    {
      field: "ff_budget",
      headerName: "FF Budget",
      width: 150,
      align: "right",
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
      rows={modifiedRows}
      columns={columns}
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
