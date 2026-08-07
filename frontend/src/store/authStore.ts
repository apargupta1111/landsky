const SERVER_IP = import.meta.env.VITE_SERVER_IP || 'http://localhost:5000';

export const createAuthSlice = (set: any) => ({
  isAuthenticated: false,
  username: '',
  token: null,
  refreshToken: null,
  login: async (user: string, pass: string) => {
    try {
      const response = await fetch(`${SERVER_IP}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user, password: pass })
      });
      if (response.ok) {
        const data = await response.json();
        set({ 
          isAuthenticated: true, 
          username: data.user.email, 
          token: data.token,
          refreshToken: data.refreshToken,
          currentPage: 'dashboard' as any 
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  },
  logout: () => set({ isAuthenticated: false, username: '', token: null, refreshToken: null, currentPage: 'dashboard' as any }),
});