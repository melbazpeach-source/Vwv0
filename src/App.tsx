import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VercelProvider, useVercel } from './context/VercelContext';
import { Layout } from './components/Layout';

// Lazy load or import pages (I'll define them below or in separate files)
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { DeploymentsPage } from './pages/DeploymentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SetupPage } from './pages/SetupPage';
import { GitHubAdminPage } from './pages/GitHubAdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const Root = () => {
  const { isAuthenticated } = useVercel();

  return (
    <Routes>
      <Route element={<Layout />}>
        {!isAuthenticated ? (
          <>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="*" element={<Navigate to="/setup" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailsPage />} />
            <Route path="/deployments" element={<DeploymentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/github" element={<GitHubAdminPage />} />
            <Route path="/setup" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VercelProvider>
        <BrowserRouter>
          <Root />
        </BrowserRouter>
      </VercelProvider>
    </QueryClientProvider>
  );
}
