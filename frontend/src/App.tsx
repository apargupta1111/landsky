import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { GatewayDetails } from './pages/GatewayDetails';
import { Analytics } from './pages/Analytics';
import { Faults } from './pages/Faults';
import { Organization } from './pages/Organization';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { useTheme } from './hooks/useTheme';
import { useAppStore } from './store/useAppStore';

function App() {
  useTheme();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const currentPage     = useAppStore((s) => s.currentPage);

  if (!isAuthenticated) return <Login />;

  return (
    <MainLayout>
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'projects' && <Projects />}
      {currentPage === 'projectDetails' && <ProjectDetails />}
      {currentPage === 'gatewayDetails' && <GatewayDetails />}
      {currentPage === 'analytics' && <Analytics />}
      {currentPage === 'faults' && <Faults />}
      {currentPage === 'organization' && <Organization />}
      {currentPage === 'settings'  && <Settings />}
    </MainLayout>
  );
}

export default App;
