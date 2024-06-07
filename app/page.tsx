"use client";

import { supabase } from "@/utils/supabase/client";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReportStore } from "@/utils/state/store";

const Home = () => {
  // @ts-ignore
  const { setSelectedReport } = useReportStore();

  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase.from("reports").select(`
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
      } else {
        setReports(data);
      }
    };

    fetchReports();
  }, []);

  const handleCenterChange = (event) => {
    const centerId = event.target.value;
    setSelectedCenter(reports.find((report) => report.id == centerId));
    setSelectedYear("");
    setSelectedVersion("");
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
    setSelectedVersion("");
  };

  const handleVersionChange = (event) => {
    setSelectedVersion(event.target.value);
  };

  const handleViewReport = () => {
    if (selectedCenter && selectedYear && selectedVersion) {
      const version = selectedCenter.report_versions.find(
        (v) => v.year == selectedYear && v.version == selectedVersion
      );
      const selectedReport = reports.find(
        (report) => report.id === selectedCenter.id
      );
      const abbreviation = selectedReport ? selectedReport.abbreviation : "";

      const selectedReportInfo = `${abbreviation} ${selectedYear} ${selectedVersion}`;
      setSelectedReport(selectedReportInfo);
      router.push(
        `/report?report_id=${selectedCenter.id}&year=${selectedYear}`
      );
    }
  };

  const years = selectedCenter
    ? [
        // @ts-ignore
        ...new Set(
          selectedCenter.report_versions
            .map((version) => version.year)
            .filter((year) => year === 2023)
        ),
      ]
    : [];

  const versions =
    selectedCenter && selectedYear
      ? selectedCenter.report_versions.filter(
          (version) => version.year == selectedYear
        )
      : [];

  return (
    <div className="m-10 w-1/2">
      <h1 className="text-2xl font-bold mb-5">Select options</h1>

      <FormControl fullWidth margin="normal">
        <InputLabel id="center-label">Center</InputLabel>
        <Select
          labelId="center-label"
          value={selectedCenter ? selectedCenter.id : ""}
          onChange={handleCenterChange}
        >
          <MenuItem value="">
            <em>Select Center</em>
          </MenuItem>
          {reports.map((report) => (
            <MenuItem key={report.id} value={report.id}>
              {report.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal" disabled={!selectedCenter}>
        <InputLabel id="year-label">Year</InputLabel>
        <Select
          labelId="year-label"
          value={selectedYear}
          onChange={handleYearChange}
        >
          <MenuItem value="">
            <em>Select Year</em>
          </MenuItem>
          {years.map((year, index) => (
            <MenuItem key={index} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal" disabled={!selectedYear}>
        <InputLabel id="version-label">Version</InputLabel>
        <Select
          labelId="version-label"
          value={selectedVersion}
          onChange={handleVersionChange}
        >
          <MenuItem value="">
            <em>Select Version</em>
          </MenuItem>
          {versions.map((version) => (
            <MenuItem key={version.id} value={version.version}>
              {version.version}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        color="primary"
        onClick={handleViewReport}
        disabled={!selectedVersion}
      >
        View Report
      </Button>
    </div>
  );
};

export default Home;
