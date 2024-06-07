import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
} from "@mui/material";
import { format } from "date-fns";

export default function SalesTable({ rows, loading }) {
  if (loading)
    return (
      <div
        style={{ display: "flex", justifyContent: "center", margin: "20px" }}
      >
        <CircularProgress />
      </div>
    );
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} size="small">
        <TableHead>
          <TableRow>
            {/* QUARTER */}
            <TableCell></TableCell>
            {/* WEEKEND */}
            <TableCell></TableCell>
            <TableCell className="w-[377px]">EVENT</TableCell>
            <TableCell>MONTH</TableCell>
            <TableCell>WEEK</TableCell>
            <TableCell>WEEKDAY</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>TO</TableCell>
            <TableCell>TO WEIGHT vs MONTH</TableCell>
            <TableCell>FF</TableCell>
            <TableCell>FF WEIGHT vs MONTH</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={index}
              sx={{
                "&:last-child td, &:last-child th": { border: 0 },
                backgroundColor: row.weekend ? "#FADDF8" : "inherit",
              }}
            >
              <TableCell component="th" scope="row">
                {row.quarter}
              </TableCell>
              <TableCell>{row.weekend ? "Weekend" : "Weekday"}</TableCell>
              <TableCell>{row.event}</TableCell>
              <TableCell>{row.month}</TableCell>
              <TableCell>{row.week}</TableCell>
              <TableCell>{row.weekday}</TableCell>
              <TableCell>{format(new Date(row.date), "dd/MM/yyyy")}</TableCell>
              <TableCell>{row.turnover}</TableCell>
              <TableCell>{row.to_weight_vs_month}</TableCell>
              <TableCell>{row.ff}</TableCell>
              <TableCell>{row.ff_weight_vs_month}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
