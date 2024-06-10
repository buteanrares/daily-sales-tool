"use client";

import SalesDataGrid from "@/components/DataGridView/SalesDataGrid";
import { supabase } from "@/utils/supabase/client";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { Button, Drawer, Tab, Tabs, TextField } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const ReportPage = () => {
  const searchParams = useSearchParams();
  const report_id = searchParams.get("report_id");
  let yearParam = parseInt(searchParams.get("year"));

  const [reportName, setReportName] = useState("");
  const [daysData, setDaysData] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [tabValue, setTabValue] = useState(yearParam);
  const [reportYears, setReportYears] = useState([2018, 2019, 2022, 2023]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadYearDate, setLoadYearDate] = useState(null);

  useEffect(() => {
    if (report_id && yearParam) {
      fetchReportVersionIdAndName(report_id, yearParam);
    }
  }, [report_id, yearParam]);

  const fetchReportVersionIdAndName = async (reportId, year) => {
    try {
      const { data: versionData, error: versionError } = await supabase
        .from("report_versions")
        .select("id")
        .eq("report_id", reportId)
        .eq("year", year)
        .single();

      if (versionError) {
        throw new Error(
          `Error fetching report version id: ${versionError.message}`
        );
      } else {
        const reportVersionId = versionData.id;
        fetchReportData(reportVersionId);
        const { data: reportData, error: reportError } = await supabase
          .from("reports")
          .select("name")
          .eq("id", reportId)
          .single();

        if (reportError) {
          throw new Error(`Error fetching report name: ${reportError.message}`);
        } else {
          setReportName(reportData.name);
        }
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchReportData = async (reportVersionId) => {
    try {
      const { data, error } = await supabase
        .from("days")
        .select("*")
        .eq("report_version_id", reportVersionId);

      if (error) {
        throw new Error(`Error fetching days data: ${error.message}`);
      } else {
        setDaysData(data);
        setLoading(false);
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    fetchReportDataForYear(newValue);
  };

  const fetchReportDataForYear = async (selectedYear) => {
    setLoading(true);
    try {
      const { data: versionData, error: versionError } = await supabase
        .from("report_versions")
        .select("id")
        .eq("report_id", report_id)
        .eq("year", selectedYear)
        .single();

      if (versionError) {
        throw new Error(
          `Error fetching report version id: ${versionError.message}`
        );
      } else {
        const reportVersionId = versionData.id;
        fetchReportData(reportVersionId);
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const filteredData = daysData.filter((item) => {
    const value = searchValue.toLowerCase();
    return (
      item.quarter.toLowerCase().includes(value) ||
      item.month.toLowerCase().includes(value) ||
      item.date.includes(value)
    );
  });

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl">{reportName}</h1>
        <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerClose}>
          <div className="flex flex-col space-y-3 w-[500px] ml-5 mt-5">
            <h1 className="text-2xl font-bold mb-5">Load year</h1>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                className="w-[40%]"
                label="Load until date"
                value={loadYearDate}
                onChange={(newValue) => setLoadYearDate(newValue)}
              />
            </LocalizationProvider>
            {loadYearDate && (
              <Button
                className="w-24"
                variant="contained"
                color="primary"
                startIcon={<SystemUpdateAltIcon className="h-5 w-5" />}
              >
                Load
              </Button>
            )}
          </div>
        </Drawer>
        <Tabs value={tabValue} onChange={handleTabChange}>
          {reportYears.map((year) => (
            <Tab key={year} label={year} value={year} />
          ))}
        </Tabs>
        <div className="flex items-center align-middle">
          <TextField
            variant="standard"
            label="Grid search..."
            onChange={handleFilterChange}
          />
          <Button onClick={handleDrawerOpen}>
            <SystemUpdateAltIcon />
          </Button>
        </div>
      </div>
      <SalesDataGrid rows={filteredData} loading={loading} />
    </div>
  );
};

export default ReportPage;
