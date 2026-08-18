const SERVER_IP = import.meta.env.VITE_SERVER_IP || 'http://localhost:5000';

export const createAuthSlice = (set: any) => ({
  isAuthenticated: false,
  username: '',
  role: '',
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
          role: data.user.role || 'user',
          token: data.access_token || data.token,
          refreshToken: data.refresh_token || data.refreshToken,
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
  register: async (userData: any) => {
    try {
      const response = await fetch(`${SERVER_IP}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (response.ok) {
        // Do NOT log the user in immediately. They are pending approval.
        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  },
  logout: () => set({ isAuthenticated: false, username: '', role: '', token: null, refreshToken: null, currentPage: 'dashboard' as any }),
});