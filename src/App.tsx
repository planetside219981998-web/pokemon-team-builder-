import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { TeamBuilderPage } from '@/pages/TeamBuilderPage';
import { RaidsPage } from '@/pages/RaidsPage';
import { IVCalculatorPage } from '@/pages/IVCalculatorPage';
import { HeadToHeadPage } from '@/pages/HeadToHeadPage';
import { TypeChartPage } from '@/pages/TypeChartPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useDataSync } from '@/hooks/useDataSync';

function AppContent() {
  useDataSync();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TeamBuilderPage />} />
        <Route path="/raids" element={<RaidsPage />} />
        <Route path="/iv" element={<IVCalculatorPage />} />
        <Route path="/h2h" element={<HeadToHeadPage />} />
        <Route path="/types" element={<TypeChartPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
