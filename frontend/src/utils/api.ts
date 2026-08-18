import { useAppStore } from '../store/useAppStore';

const SERVER_IP = import.meta.env.VITE_SERVER_IP || 'http://localhost:5000';

/**
 * A wrapper around fetch that automatically handles Authorization headers
 * and seamlessly retries with a new Access Token if a 401 Unauthorized occurs
 * and a Refresh Token is available.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const store = useAppStore.getState();
  const token = store.token;
  const refreshToken = store.refreshToken;
  
  // 1. Set initial auth header
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // 2. Perform original request
  let response = await fetch(url, { ...options, headers });
  
  // 3. Check for 401 Unauthorized
  if (response.status === 401) {
    if (refreshToken) {
      console.log('Access token expired, attempting to refresh...');
      
      try {
        // Attempt to get a new access token
        const refreshResponse = await fetch(`${SERVER_IP}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const newToken = data.access_token;
          const newRefreshToken = data.refresh_token;
          
          // Update the global store with the new tokens
          useAppStore.setState({ token: newToken, refreshToken: newRefreshToken });
          
          console.log('Successfully refreshed access token!');
          
          // Retry the original request with the new access token
          headers.set('Authorization', `Bearer ${newToken}`);
          response = await fetch(url, { ...options, headers });
        } else {
          // Refresh token is expired or invalid
          console.warn('Refresh token rejected. Logging out.');
          store.logout();
        }
      } catch (err) {
        console.error('Failed to contact refresh endpoint', err);
        store.logout();
      }
    } else {
      // No refresh token available to try
      console.warn('401 Unauthorized and no refresh token available. Logging out.');
      store.logout();
    }
  }
  
  return response;
}
