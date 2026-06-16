export const createUISlice = (set: any) => ({
  isDarkMode: true,
  toggleTheme: () => set((s: any) => ({ isDarkMode: !s.isDarkMode })),
  sidebarOpen: true,
  toggleSidebar: () => set((s: any) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  currentPage: 'dashboard' as any,
  setCurrentPage: (page: any) => set({ currentPage: page }),
});