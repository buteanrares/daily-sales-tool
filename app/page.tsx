"use client";

import SalesTable from "@/components/SalesTable";
import { refinedData2018 } from "@/data/2018";
import { refinedData2019 } from "@/data/2019";
import { refinedData2022 } from "@/data/2022";
import { Autocomplete, Button, Drawer, TextField } from "@mui/material";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { useState, useEffect } from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import { supabase } from "@/utils/supabase/client";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <div>{children}</div>
        </Box>
      )}
    </div>
  );
}

async function getReports() {
  const { data: reports, error } = await supabase.from("reports").select(`
    id,
    name,
    abbreviation,
    report_years (year, visible)
  `);

  if (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
  return reports;
}

export default function Home() {
  const [reports, setReports] = useState([]);
  const [centerName, setCenterName] = useState("");
  const [dataId, setDataId] = useState("VCPFO");
  const [tabValue, setTabValue] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [drawerState, setDrawerState] = useState(false);
  const [loadYearDate, setLoadYearDate] = useState(null);
  const [reportYears, setReportYears] = useState([]);

  useEffect(() => {
    async function fetchReports() {
      const fetchedReports = await getReports();
      setReports(fetchedReports);
      if (fetchedReports.length > 0) {
        const defaultReport = fetchedReports[0];
        setCenterName(defaultReport.name);
        setDataId(defaultReport.abbreviation);
        setReportYears(
          defaultReport.report_years
            .filter((year) => year.visible)
            .map((year) => year.year)
        );
      }
    }
    fetchReports();
  }, []);

  const fetchReportYears = async (abbreviation) => {
    const report = reports.find((r) => r.abbreviation === abbreviation);
    if (report) {
      setReportYears(
        report.report_years
          .filter((year) => year.visible)
          .map((year) => year.year)
      );
    }
  };

  const drawerContent = (
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
  );

  const getDataForTab = () => {
    if (tabValue === 0) return refinedData2018[dataId];
    if (tabValue === 1) return refinedData2019[dataId];
    if (tabValue === 2) return refinedData2022[dataId];
    return [];
  };

  const handleFilterChange = (e) => {
    setSearchValue(e.target.value);
  };

  const filteredData = getDataForTab().filter((item) => {
    const value = searchValue.toLowerCase();
    return (
      item.QUARTER.toLowerCase().includes(value) ||
      item.MONTH.toLowerCase().includes(value) ||
      item.DATE.includes(value)
    );
  });

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCenterChange = async (e, value) => {
    if (value) {
      setCenterName(value.name);
      setDataId(value.abbreviation);
      await fetchReportYears(value.abbreviation);
    }
  };

  return (
    <>
      <div className="flex items-center px-4 pt-4 bg-white shadow-md sticky">
        <p>{centerName}</p>
        <Tabs
          value={tabValue}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
          className="w-[350px]"
        >
          {reportYears.map((year, index) => (
            <Tab key={year} label={year} />
          ))}
        </Tabs>
        <div className="flex justify-end items-center">
          <Autocomplete
            disablePortal
            sx={{ width: 250 }}
            options={reports}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField {...params} variant="standard" label="Center name" />
            )}
            onChange={handleCenterChange}
          />
          <TextField
            variant="standard"
            label="Grid search..."
            onChange={handleFilterChange}
          />
          <Button
            onClick={() => setDrawerState(true)}
            startIcon={<SettingsIcon />}
          />
          <Drawer open={drawerState} onClose={() => setDrawerState(false)}>
            {drawerContent}
          </Drawer>
        </div>
      </div>
      {reportYears.map((year, index) => (
        <CustomTabPanel key={year} value={tabValue} index={index}>
          <SalesTable rows={filteredData} />
        </CustomTabPanel>
      ))}
    </>
  );
}
