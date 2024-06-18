"use client";

import { supabase } from "@/utils/supabase/client";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

async function getReports() {
  const { data: reports, error } = await supabase
    .from("reports")
    .select(
      `
          id, 
          name, 
          abbreviation,
          report_versions (
            id, 
            year, 
            version, 
            visible
          )
        `
    )
    .order("name", { ascending: true });

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

    const { data, error } = await supabase
      .from("report_versions")
      .insert([{ report_id: report.id, version: newVersion, year: 2023 }]);

    if (error) {
      console.error("Error creating new version:", error);
    } else {
      setReports(await getReports());
      return data;
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
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const headers = parsedData[0];

        const relevantHeaders = [
          "TO 2018",
          "FF 2018",
          "Event 2018",
          "TO 2019",
          "FF 2019",
          "Event 2018",
          "TO 2022",
          "FF 2022",
          "Event 2022",
          "TO 2023",
          "FF 2023",
          "Event 2023",
          "TO Budget 2023",
          "FF Budget 2023",
        ];
        const relevantHeaderIndices = relevantHeaders.map((header) =>
          headers.indexOf(header)
        );

        const fileData = {
          "TO 2018": [],
          "FF 2018": [],
          "Event 2018": [],
          "TO 2019": [],
          "FF 2019": [],
          "Event 2019": [],
          "TO 2022": [],
          "FF 2022": [],
          "Event 2022": [],
          "TO 2023": [],
          "FF 2023": [],
          "Event 2023": [],
          "TO Budget 2023": [],
          "FF Budget 2023": [],
        };

        parsedData.slice(1).forEach((row: any[]) => {
          relevantHeaderIndices.forEach((index, i) => {
            fileData[relevantHeaders[i]].push(row[index]);
          });
        });

        const report = reports.find((r) => r.id === parseInt(selectedReport));
        const newVersionNumber =
          Math.max(
            ...report.report_versions.map((v) =>
              parseInt(v.version.replace("v", ""))
            ),
            0
          ) + 1;
        const newVersion = `v${newVersionNumber}`;

        (async () => {
          const years = [2018, 2019, 2022, 2023];
          const daysData = [];

          for (let i = 0; i < years.length; i++) {
            const year = years[i];
            const startDate = new Date(`${year}-01-01`);
            const endDate = new Date(`${year}-12-31`);
            let currentDate = new Date(startDate);

            const { data } = await supabase
              .from("report_versions")
              .insert([{ report_id: report.id, version: newVersion, year }])
              .select()
              .single();

            while (currentDate <= endDate) {
              const day = currentDate.getDate();
              const month = currentDate.getMonth() + 1;
              const year = currentDate.getFullYear();

              let turnover = null;
              let ff = null;
              let to_budget = null;
              let ff_budget = null;

              const index = Math.round(
                (currentDate - startDate) / (1000 * 60 * 60 * 24)
              );

              turnover = fileData[`TO ${year}`][index] || 0;
              ff = fileData[`FF ${year}`][index] || 0;

              if (year === 2023) {
                to_budget = fileData[`TO Budget ${year}`][index] || 0;
                ff_budget = fileData[`FF Budget ${year}`][index] || 0;
              }

              const event = fileData[`Event ${year}`][index];

              daysData.push({
                report_id: data.report_id,
                report_version_id: data.id,
                date: `${year}-${month}-${day}`,
                event,
                turnover,
                ff,
                to_budget,
                ff_budget,
              });

              currentDate.setDate(currentDate.getDate() + 1);
            }
          }

          await supabase.from("days").insert(daysData);
          toast.success("Report created successfully!");
        })();
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="px-10 py-8 flex justify-between">
      <div className="flex-row space-y-5 w-2/5">
        <h1 className="text-2xl font-bold mb-5">Versioning</h1>

        {/* Select Report */}
        <FormControl fullWidth>
          <InputLabel>Select Center</InputLabel>
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
          {selectedReport && selectedYears && (
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
