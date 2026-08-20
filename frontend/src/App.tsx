import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Nagarpalikas } from './pages/Nagarpalikas';
import { Wards } from './pages/Wards';
import { WardDetails } from './pages/WardDetails';
import { Gateways } from './pages/Gateways';
import { GatewayDetails } from './pages/GatewayDetails';
import { Analytics } from './pages/Analytics';
import { Faults } from './pages/Faults';
import { Organization } from './pages/Organization';
import { Team } from './pages/Team';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { useTheme } from './hooks/useTheme';
import { useAppStore } from './store/useAppStore';

import { useEffect, useState } from 'react';

function App() {
  useTheme();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const currentPage     = useAppStore((s) => s.currentPage);
  const fetchDevices    = useAppStore((s) => s.fetchDevices);
  const fetchGateways   = useAppStore((s) => s.fetchGateways);
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices();
      fetchGateways();

      // Re-fetch every 60s so offline status from the backend sweep is reflected
      const interval = setInterval(() => {
        fetchDevices();
        fetchGateways();
      }, 60_000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchDevices, fetchGateways]);

  if (!isAuthenticated) {
    if (authMode === 'register') {
      return (
        <>
          <div className="cyber-bg"><div className="cyber-grid"></div></div>
          <Register onGoToLogin={() => setAuthMode('login')} />
        </>
      );
    }
    return (
      <>
        <div className="cyber-bg"><div className="cyber-grid"></div></div>
        <Login onGoToRegister={() => setAuthMode('register')} />
      </>
    );
  }

  return (
    <>
      <div className="cyber-bg"><div className="cyber-grid"></div></div>
      <MainLayout>
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'projects' && <Projects />}
      {currentPage === 'nagarpalikas' && <Nagarpalikas />}
      {currentPage === 'wards' && <Wards />}
      {currentPage === 'wardDetails' && <WardDetails />}
      {currentPage === 'gateways' && <Gateways />}
      {currentPage === 'gatewayDetails' && <GatewayDetails />}
      {currentPage === 'analytics' && <Analytics />}
      {currentPage === 'faults' && <Faults />}
      {currentPage === 'organization' && <Organization />}
      {currentPage === 'team' && <Team />}
      {currentPage === 'settings'  && <Settings />}
    </MainLayout>
    </>
  );
}

export default App;
