import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { useTheme } from './hooks/useTheme';

function App() {
  // Initialize theme
  useTheme();

  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  );
}

export default App;
