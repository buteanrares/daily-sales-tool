"use client";

import { useState, useEffect } from "react";
import {
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { supabase } from "@/utils/supabase/client";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddIcon from "@mui/icons-material/Add";
import * as XLSX from "xlsx";

async function getReports() {
  const { data: reports, error } = await supabase.from("reports").select(`
          id, 
          name, 
          abbreviation,
          report_versions (
            id, 
            year, 
            version, 
            visible
          )
        `);

  if (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
  return reports;
}

export default function Versioning() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [selectedYears, setSelectedYears] = useState([]);

  useEffect(() => {
    async function fetchReports() {
      const fetchedReports = await getReports();
      setReports(fetchedReports);
    }
    fetchReports();
  }, []);

  const handleUpsertVersion = async () => {
    if (!selectedReport || !selectedYears.length) return;

    const report = reports.find((r) => r.id === parseInt(selectedReport));
    if (!report) return;

    const newVersionNumber =
      Math.max(
        ...report.report_versions.map((v) =>
          parseInt(v.version.replace("v", ""))
        ),
        0
      ) + 1;
    const newVersion = `v${newVersionNumber}`;

    const { error } = await supabase
      .from("report_versions")
      .insert([{ report_id: report.id, version: newVersion, year: 2023 }]);

    if (error) {
      console.error("Error creating new version:", error);
    } else {
      alert(`Created new version: ${newVersion}`);
      setReports(await getReports());
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target && e.target.result) {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        console.log(workbook);

        const sheetName = workbook.SheetNames[0];
        console.log(sheetName);

        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const headers = parsedData[0];

        const relevantHeaders = [
          "TO 2018",
          "FF 2018",
          "TO 2019",
          "FF 2019",
          "TO 2022",
          "FF 2022",
        ];
        const relevantHeaderIndices = relevantHeaders.map((header) =>
          headers.indexOf(header)
        );

        const fileData = {
          "TO 2018": [],
          "FF 2018": [],
          "TO 2019": [],
          "FF 2019": [],
          "TO 2022": [],
          "FF 2022": [],
        };
        console.log("ok");
        console.log(s);

        parsedData.slice(1).forEach((row: any[]) => {
          relevantHeaderIndices.forEach((index, i) => {
            fileData[relevantHeaders[i]].push(row[index]);
          });
        });

        console.log(parsedData);
      }
    };
  };

  return (
    <div className="px-10 py-8 flex justify-between">
      <div className="flex-row space-y-5 w-2/5">
        <h1 className="text-2xl font-bold mb-5">Report Versioning</h1>

        {/* Select Report */}
        <FormControl fullWidth>
          <InputLabel>Select Report</InputLabel>
          <Select
            variant="standard"
            value={selectedReport}
            onChange={(e) => {
              setSelectedReport(e.target.value);
              setSelectedVersion(""); // Reset version when report changes
            }}
          >
            {reports.map((report) => (
              <MenuItem key={report.id} value={report.id}>
                {report.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Select Year */}
        {selectedReport && (
          <FormControl fullWidth>
            <InputLabel id="year-select-label">Select Year</InputLabel>
            <Select
              labelId="year-select-label"
              variant="standard"
              value={selectedYears}
              onChange={(e) => setSelectedYears([e.target.value])}
            >
              <MenuItem value={2023}>2023</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Select Version */}
        {selectedReport && (
          <FormControl fullWidth>
            <InputLabel>Select Version</InputLabel>
            <Select
              variant="standard"
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
            >
              {reports
                .find((report) => report.id === parseInt(selectedReport))
                .report_versions.map((version) => (
                  <MenuItem key={version.id} value={version.id}>
                    {version.version}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}

        {/* Buttons */}
        <div className="space-x-3">
          {selectedReport && (
            <>
              <Button variant="contained" component="label">
                Upload File
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  hidden
                />
              </Button>
              {selectedVersion && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleUpsertVersion}
                >
                  Copy Version
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
