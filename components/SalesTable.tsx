import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import React from "react";

export default function SalesTable({ rows }) {
  console.log(rows);

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
                backgroundColor:
                  row.WEEKEND === "Weekend" ? "violet" : "inherit",
              }}
            >
              <TableCell component="th" scope="row">
                {row.QUARTER}
              </TableCell>
              <TableCell>{row.WEEKEND}</TableCell>
              <TableCell>{row.EVENT}</TableCell>
              <TableCell>{row.MONTH}</TableCell>
              <TableCell>{row.WEEK}</TableCell>
              <TableCell>{row.WEEKDAY}</TableCell>
              <TableCell>{row.DATE}</TableCell>
              <TableCell>{row.TURNOVER}</TableCell>
              <TableCell>{row.TO_WEIGHT_vs_MONTH}</TableCell>
              <TableCell>{row.FF}</TableCell>
              <TableCell>{row.FF_WEIGHT_vs_MONTH}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
