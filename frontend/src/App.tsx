import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
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
      {currentPage === 'settings'  && <Settings />}
    </MainLayout>
  );
}

export default App;
