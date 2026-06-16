const VALID_USER = 'a';
const VALID_PASS = 'a';

export const createAuthSlice = (set: any) => ({
  isAuthenticated: false,
  username: '',
  login: (user: string, pass: string) => {
    if (user === VALID_USER && pass === VALID_PASS) {
      set({ isAuthenticated: true, username: user, currentPage: 'dashboard' as any });
      return true;
    }
    return false;
  },
  logout: () => set({ isAuthenticated: false, username: '', currentPage: 'dashboard' as any }),
});