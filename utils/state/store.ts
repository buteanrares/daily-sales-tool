import { create } from "zustand";

export const useReportStore = create((set) => ({
  selectedReport: null,
  setSelectedReport: (report) => set({ selectedReport: report }),
}));
