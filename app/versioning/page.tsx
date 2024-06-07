"use client";

import { useState, useEffect } from "react";
import {
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
} from "@mui/material";
import { supabase } from "@/utils/supabase/client";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";

async function getReports() {
  const { data: reports, error } = await supabase.from("reports").select(`
      id, 
      name, 
      abbreviation,
      report_versions (id, version),
      report_years (year, visible)
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

  const handleSaveChanges = async () => {
    if (!selectedReport) return;

    const report = reports.find((r) => r.id === parseInt(selectedReport));
    if (!report) return;

    const updates = report.report_years.map((year) => ({
      year: year.year,
      visible: selectedYears.includes(year.year),
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from("report_years")
        .update({ visible: update.visible })
        .eq("report_id", selectedReport)
        .eq("year", update.year);

      if (error) {
        console.error("Error updating year visibility:", error);
      }
    }

    setReports(await getReports());
  };

  const handleCopyVersion = async () => {
    if (!selectedReport || !selectedVersion) return;

    const report = reports.find((r) => r.id === parseInt(selectedReport));
    const versionToCopy = report.report_versions.find(
      (v) => v.id === parseInt(selectedVersion)
    );

    const newVersionNumber =
      Math.max(
        ...report.report_versions.map((v) =>
          parseInt(v.version.replace("v", ""))
        )
      ) + 1;
    const newVersion = `v${newVersionNumber}`;

    const { error } = await supabase
      .from("report_versions")
      .insert([{ report_id: report.id, version: newVersion }]);

    if (error) {
      console.error("Error copying version:", error);
    } else {
      alert(`Copied to new version: ${newVersion}`);
      setReports(await getReports());
    }
  };

  return (
    <div className="px-10 py-8 flex justify-between">
      <div className="flex-row space-y-5 w-2/5">
        <h1 className="text-2xl font-bold mb-5">Report Versioning</h1>
        <FormControl fullWidth>
          <InputLabel>Select Report</InputLabel>
          <Select
            variant="standard"
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
          >
            {reports.map((report) => (
              <MenuItem key={report.id} value={report.id}>
                {report.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedReport && (
          <FormControl fullWidth>
            <InputLabel id="years-select-label">Select Years</InputLabel>
            <Select
              labelId="years-select-label"
              variant="standard"
              multiple
              value={selectedYears}
              onChange={(e) => setSelectedYears(e.target.value)}
              renderValue={(selected) => selected.join(", ")}
            >
              {reports
                .find((report) => report.id === parseInt(selectedReport))
                .report_years.map((year) => (
                  <MenuItem key={year.year} value={year.year}>
                    <Checkbox
                      checked={
                        selectedYears.includes(year.year) ? year.visible : false
                      }
                    />
                    <ListItemText primary={year.year} />
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}

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
        <div className="space-x-3">
          {selectedReport && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon className="h-5 w-5" />}
                onClick={handleSaveChanges}
              >
                Save
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon className="h-5 w-5" />}
                onClick={handleCopyVersion}
              >
                New version
              </Button>
            </>
          )}

          {selectedReport && selectedVersion && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ContentCopyIcon className="h-5 w-5" />}
              onClick={handleCopyVersion}
            >
              Copy Version
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
