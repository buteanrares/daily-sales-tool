"use client";

import SalesDataGrid from "@/components/DataGridView/SalesDataGrid";
import { supabase } from "@/utils/supabase/client";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import { Button, Drawer, Tab, Tabs, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const ReportPage = ({ params }) => {
  const { report_version_id } = params;
  const [reportVersions, setReportVersions] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [daysData, setDaysData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [cutoffDate, setCutoffDate] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (report_version_id) {
      fetchReportVersions(report_version_id);
    }
  }, [report_version_id]);

  const fetchReportVersions = async (reportVersionId) => {
    setLoading(true);
    try {
      const { data: specifiedVersionData, error: specifiedVersionError } =
        await supabase
          .from("report_versions")
          .select("*")
          .eq("id", reportVersionId)
          .single();

      if (specifiedVersionError) {
        throw new Error(
          `Error fetching specified report version data: ${specifiedVersionError.message}`
        );
      } else {
        const reportId = specifiedVersionData.report_id;
        const currentYear = specifiedVersionData.year;
        const previousYears = [
          currentYear - 1,
          currentYear - 4,
          currentYear - 5,
        ];

        const promises = previousYears.map(async (year) => {
          const { data: versionData, error: versionError } = await supabase
            .from("report_versions")
            .select("*,reports(*)")
            .eq("report_id", reportId)
            .eq("year", year)
            .single();

          if (versionError) {
            throw new Error(
              `Error fetching report version data for year ${year}: ${versionError.message}`
            );
          } else {
            return versionData;
          }
        });

        const previousVersionsData = await Promise.all(promises);
        const allVersionsData = [specifiedVersionData, ...previousVersionsData];
        const sortedVersionsData = allVersionsData.sort(
          (a, b) => a.year - b.year
        );
        setReportVersions(sortedVersionsData);
        setSelectedYear(currentYear);
        fetchDaysData(allVersionsData);
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchDaysData = async (reportVersionsData) => {
    setLoading(true);
    try {
      const promises = reportVersionsData.map(async (versionData) => {
        const { data, error } = await supabase
          .from("days")
          .select("*")
          .eq("report_version_id", versionData.id)
          .order("date", { ascending: true });

        if (error) {
          throw new Error(`Error fetching days data: ${error.message}`);
        } else {
          return { year: versionData.year, data };
        }
      });

      const daysDataForYears = await Promise.all(promises);
      const groupedDaysData = daysDataForYears.reduce((acc, curr) => {
        acc[curr.year] = curr.data;
        return acc;
      }, {});

      setDaysData(groupedDaysData);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedYear(newValue);
  };

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target && e.target.result) {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Assuming the headers are in the first row
        const headers = parsedData[0];

        const relevantHeaders = [
          "TO 2023",
          "TO Budget 2023",
          "FF 2023",
          "FF Budget 2023",
        ];
        const relevantHeaderIndices = relevantHeaders.map((header) =>
          headers.indexOf(header)
        );

        const fileData = {
          "TO 2023": [],
          "TO Budget 2023": [],
          "FF 2023": [],
          "FF Budget 2023": [],
        };

        parsedData.slice(1).forEach((row: any[]) => {
          const rowDate = new Date(row[0]);
          if (rowDate <= new Date(cutoffDate)) {
            relevantHeaderIndices.forEach((index, i) => {
              fileData[relevantHeaders[i]].push(row[index]);
            });
          }
        });

        setFileData(fileData);

        const startDate = new Date("2023-01-01");
        const endDate = new Date(cutoffDate);

        const daysData = [];
        let currentDate = new Date(startDate);

        const { id: report_version_id, report_id } = reportVersions.at(-1);
        while (currentDate <= endDate) {
          const day = currentDate.getDate();
          const month = currentDate.getMonth() + 1;
          const year = currentDate.getFullYear();

          const index = (currentDate - startDate) / (1000 * 60 * 60 * 24);
          const turnover = fileData["TO 2023"][index] || 0;
          const toBudget = fileData["TO Budget 2023"][index] || 0;
          const ff = fileData["FF 2023"][index] || 0;
          const ffBudget = fileData["FF Budget 2023"][index] || 0;

          daysData.push({
            report_id,
            report_version_id,
            date: `${year}-${month}-${day}`,
            turnover,
            to_budget: toBudget,
            ff,
            ff_budget: ffBudget,
          });

          // Move to the next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
        await supabase
          .from("days")
          .delete()
          .eq("report_version_id", report_version_id)
          .in(
            "date",
            daysData.map((day) => day.date)
          );
        await supabase.from("days").insert(daysData);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      {reportVersions.length > 0 && (
        <div className="sticky top-12 z-10 bg-white flex items-center justify-between">
          <h1 className="text-xl">{reportVersions[0].reports.name}</h1>
          <div className="flex space-x-2">
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={handleDrawerClose}
            >
              <div className="flex flex-col space-y-3 w-[500px] ml-5 mt-5">
                <h1 className="text-2xl font-bold mb-5">Load year</h1>
                {/* Implement your year loading functionality here */}
              </div>
            </Drawer>
            <Tabs value={selectedYear} onChange={handleTabChange}>
              {reportVersions.map((version) => (
                <Tab
                  key={version.year}
                  label={version.year}
                  value={version.year}
                />
              ))}
            </Tabs>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    size: "small",
                    variant: "standard",
                    className: "w-36",
                  },
                }}
                minDate={dayjs(new Date("2023-01-01"))}
                maxDate={dayjs(new Date("2023-12-31"))}
                label="Cutoff date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e)}
              />
            </LocalizationProvider>
            {cutoffDate && (
              <Button variant="contained" component="label">
                Upload File
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  hidden
                />
              </Button>
            )}
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
        </div>
      )}
      {daysData[selectedYear] && (
        <div>
          <SalesDataGrid
            rows={daysData[selectedYear].filter((item) =>
              Object.values(item).some((val) =>
                val.toString().toLowerCase().includes(searchValue.toLowerCase())
              )
            )}
            loading={loading}
            editable={true}
          />
        </div>
      )}
    </div>
  );
};

export default ReportPage;
