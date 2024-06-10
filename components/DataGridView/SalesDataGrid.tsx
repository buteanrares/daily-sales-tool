import { supabase } from "@/utils/supabase/client";
import { LinearProgress } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridEventListener,
  GridRowEditStopReasons,
  GridRowModel,
  GridRowModesModel,
} from "@mui/x-data-grid";
import { format } from "date-fns";
import { useState } from "react";

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

  const columns: GridColDef[] = [
    { field: "quarter", headerName: "Quarter", width: 100 },
    {
      field: "weekend",
      headerName: "Weekend",
      width: 100,
      renderCell: (params) => (params.value ? "Weekend" : "Weekday"),
    },
    { field: "event", headerName: "Event", width: 377, editable: editable },
    { field: "month", headerName: "Month", width: 100 },
    { field: "week", headerName: "Week", width: 100 },
    { field: "weekday", headerName: "Weekday", width: 100 },
    {
      field: "date",
      headerName: "Date",
      width: 150,
      editable: editable,
      valueGetter: (params) => format(params, "dd/MM/yyyy"),
    },
    { field: "turnover", headerName: "TO", width: 150, editable: editable },
    {
      field: "to_weight_vs_month",
      headerName: "TO Weight vs Month",
      width: 150,
    },
    { field: "ff", headerName: "FF", width: 150, editable: editable },
    {
      field: "ff_weight_vs_month",
      headerName: "FF Weight vs Month",
      width: 150,
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
    <div className="w-4/5 mx-auto">
      <DataGrid
        rows={rows}
        columns={columns}
        density="compact"
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        autoHeight={false}
      />
    </div>
  );
}
