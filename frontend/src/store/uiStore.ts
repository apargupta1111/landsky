import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Page =
  | "dashboard"
  | "projects"
  | "gateways"
  | "analytics"
  | "settings"
  | "faults"
  | "organization"
  | "projectDetails"
  | "gatewayDetails";

interface UIState {
  isDarkMode: boolean;
  sidebarOpen: boolean;

  currentPage: Page;

  selectedProjectId: string | null;
  selectedGatewayId: string | null;
  selectedLightId: string | null;

  toggleTheme: () => void;
  toggleSidebar: () => void;

  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: Page) => void;

  setSelectedProjectId: (id: string | null) => void;
  setSelectedGatewayId: (id: string | null) => void;
  setSelectedLightId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isDarkMode: true,
      sidebarOpen: true,

      currentPage: "dashboard",

      selectedProjectId: null,
      selectedGatewayId: null,
      selectedLightId: null,

      toggleTheme: () =>
        set((s) => ({
          isDarkMode: !s.isDarkMode,
        })),

      toggleSidebar: () =>
        set((s) => ({
          sidebarOpen: !s.sidebarOpen,
        })),

      setSidebarOpen: (open) =>
        set({
          sidebarOpen: open,
        }),

      setCurrentPage: (page) =>
        set({
          currentPage: page,
        }),

      setSelectedProjectId: (id) =>
        set({
          selectedProjectId: id,
        }),

      setSelectedGatewayId: (id) =>
        set({
          selectedGatewayId: id,
        }),

      setSelectedLightId: (id) =>
        set({
          selectedLightId: id,
        }),
    }),
    {
      name: "ui-store",
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);