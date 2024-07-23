"use client";

import SalesDataGrid from "@/components/DataGridView/SalesDataGrid";
import { useReportStore } from "@/utils/state/store";
import { supabase } from "@/utils/supabase/client";
import {
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { format, getISOWeek, getQuarter } from "date-fns";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 28,
  height: 16,
  padding: 0,
  display: "flex",
  "&:active": {
    "& .MuiSwitch-thumb": {
      width: 15,
    },
    "& .MuiSwitch-switchBase.Mui-checked": {
      transform: "translateX(9px)",
    },
  },
  "& .MuiSwitch-switchBase": {
    padding: 2,
    "&.Mui-checked": {
      transform: "translateX(12px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.mode === "dark" ? "#177ddc" : "#1890ff",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "0 2px 4px 0 rgb(0 35 11 / 20%)",
    width: 12,
    height: 12,
    borderRadius: 6,
    transition: theme.transitions.create(["width"], {
      duration: 200,
    }),
  },
  "& .MuiSwitch-track": {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(255,255,255,.35)"
        : "rgba(0,0,0,.25)",
    boxSizing: "border-box",
  },
}));

const ReportPage = ({ params }) => {
  const { report_version_id } = params;
  const { selectedReport } = useReportStore();
  const [reportVersions, setReportVersions] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [daysData, setDaysData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [cutoffDate, setCutoffDate] = useState(dayjs("2023-01-01"));
  const [showTO, setShowTO] = useState(true);

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
        const cutoffDate = specifiedVersionData.cutoff_date;
        setCutoffDate(dayjs(cutoffDate));
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
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedYear(newValue);
  };

  async function handleCutoffDateChange(e) {
    setCutoffDate(dayjs(e));
    await supabase
      .from("report_versions")
      .update({ cutoff_date: new Date(e) })
      .eq("id", report_version_id);
  }

  return (
    <div>
      {reportVersions.length > 0 && (
        <div className="sticky top-12 z-10 bg-white flex items-center justify-between px-5">
          <h1 className="text-sm">
            {reportVersions[0].reports.name} {selectedReport}
          </h1>
          <Tabs value={selectedYear} onChange={handleTabChange}>
            {reportVersions.map((version) => (
              <Tab
                key={version.year}
                label={<p className="text-sm">{version.year}</p>}
                value={version.year}
              />
            ))}
          </Tabs>
          <div className="flex space-x-4">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography>FF</Typography>
              <AntSwitch
                defaultChecked
                onChange={(e) => setShowTO(e.target.checked)}
                inputProps={{ "aria-label": "ant design" }}
              />
              <Typography>TO</Typography>
            </Stack>
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
                className="-bottom-[3px]"
                minDate={dayjs(new Date("2023-01-01"))}
                maxDate={dayjs(new Date("2023-12-31"))}
                label="Cutoff date"
                value={cutoffDate}
                onChange={handleCutoffDateChange}
              />
            </LocalizationProvider>
            <div className="flex items-center align-middle">
              <TextField
                variant="standard"
                label="Grid search..."
                onChange={handleFilterChange}
                className="w-36"
              />
            </div>
          </div>
        </div>
      )}
      {daysData[selectedYear] && (
        <div>
          <SalesDataGrid
            rows={daysData[selectedYear].filter((item) => {
              const lowerCaseSearch = searchValue?.toLowerCase();

              const date = new Date(item.date);
              const quarter = `q${getQuarter(date)}`;
              const month = format(date, "MMMM")?.toLowerCase();
              const dayMonth = format(date, "dd/MM");
              const week = getISOWeek(date).toString();

              // Guard case search is for quarter and starts with q
              if (lowerCaseSearch === "q") return true;

              if (searchValue.startsWith("q") || searchValue.startsWith("Q"))
                // Check for quarter match
                return quarter === lowerCaseSearch;

              // Check for month match
              if (month.includes(lowerCaseSearch)) return true;

              // Check for day/month match
              if (dayMonth.includes(lowerCaseSearch)) return true;

              // Check for week match
              if (week === searchValue) return true;

              return false;
            })}
            loading={loading}
            editable={selectedYear >= 2023}
            extended={selectedYear >= 2023}
            cutoffDate={cutoffDate}
            reportVersionId={report_version_id}
            showTO={showTO}
          />
        </div>
      )}
    </div>
  );
};

export default ReportPage;
