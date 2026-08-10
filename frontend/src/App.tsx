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
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { useTheme } from './hooks/useTheme';
import { useAppStore } from './store/useAppStore';

import { useEffect } from 'react';

function App() {
  useTheme();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const currentPage     = useAppStore((s) => s.currentPage);
  const fetchDevices    = useAppStore((s) => s.fetchDevices);
  const fetchGateways   = useAppStore((s) => s.fetchGateways);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices();
      fetchGateways();
    }
  }, [isAuthenticated, fetchDevices, fetchGateways]);

  if (!isAuthenticated) return <Login />

  return (
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
      {currentPage === 'settings'  && <Settings />}
    </MainLayout>
  );
}

export default App;
