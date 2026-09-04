import React, { Suspense, lazy, useEffect } from 'react';
import { Toaster } from "./components/ui/toaster"
import { QueryClientProvider } from './tanstack/react-query'
import { queryClientInstance } from './lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Home from './pages/Home';
import { AuthProvider, useAuth } from './lib/AuthContext';
import UserNotRegisteredError from './components/UserNotRegisteredError';
// Add page imports here — secondary pages stay lazy-loaded to reduce the initial bundle.
// Home loads directly so preview updates cannot leave the primary route on a stale chunk.
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const ZmanimGuide = lazy(() => import('./pages/ZmanimGuide'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LocationManager = lazy(() => import('./pages/LocationManager'));
const SavedLocations = lazy(() => import('./pages/SavedLocations'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const ExportHistory = lazy(() => import('./pages/ExportHistory'));
const SearchHistoryPage = lazy(() => import('./pages/SearchHistoryPage'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));
const SolarCalculator = lazy(() => import('./pages/SolarCalculator'));
const MapPicker = lazy(() => import('./pages/MapPicker'));
const Glossary = lazy(() => import('./pages/Glossary'));
const ReportIssue = lazy(() => import('./pages/ReportIssue'));
const UserSettings = lazy(() => import('./pages/UserSettings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
import ProtectedRoute from './components/ProtectedRoute';
import SeoMeta, { NoIndexMeta } from './components/SeoMeta';
import PublicPageLinks from './components/PublicPageLinks';
import { LanguageProvider } from './lib/LanguageContext';
import LazyLoadingFallback from './components/LazyLoadingFallback';
import LazyChunkErrorBoundary from './components/LazyChunkErrorBoundary';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  useEffect(() => {
    if (authError?.type === 'auth_required') navigateToLogin();
  }, [authError?.type]);

  if ((isLoadingPublicSettings || isLoadingAuth) && !authError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0D1B2A' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="text-2xl">☀</div>
          <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-400 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return null;
    }
    // For unknown errors or public apps, still render
  }

  return (
    <LazyChunkErrorBoundary>
    <Suspense fallback={<LazyLoadingFallback />}>
    <Routes>
      <Route path="/login" element={<><NoIndexMeta /><Login /></>} />
      <Route path="/register" element={<><NoIndexMeta /><Register /></>} />
      <Route path="/forgot-password" element={<><NoIndexMeta /><ForgotPassword /></>} />
      <Route path="/reset-password" element={<><NoIndexMeta /><ResetPassword /></>} />
      <Route path="/" element={<><SeoMeta pageKey="home" /><Home /></>} />
      <Route path="/about" element={<><SeoMeta pageKey="about" /><About /><PublicPageLinks /></>} />
      <Route path="/contact" element={<><SeoMeta pageKey="contact" /><Contact /><PublicPageLinks /></>} />
      <Route path="/zmanim-guide" element={<><SeoMeta pageKey="zmanim-guide" /><ZmanimGuide /><PublicPageLinks /></>} />
      <Route path="/system-status" element={<><NoIndexMeta /><SystemStatus /></>} />
      <Route path="/solar-calculator" element={<><SeoMeta pageKey="solar-calculator" /><SolarCalculator /><PublicPageLinks /></>} />
      <Route path="/glossary" element={<><SeoMeta pageKey="glossary" /><Glossary /><PublicPageLinks /></>} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/dashboard" element={<><NoIndexMeta /><Dashboard /></>} />
        <Route path="/locations" element={<><NoIndexMeta /><LocationManager /></>} />
        <Route path="/saved-locations" element={<><NoIndexMeta /><SavedLocations /></>} />
        <Route path="/profile" element={<><NoIndexMeta /><UserProfile /></>} />
        <Route path="/export-history" element={<><NoIndexMeta /><ExportHistory /></>} />
        <Route path="/search-history" element={<><NoIndexMeta /><SearchHistoryPage /></>} />
        <Route path="/report-issue" element={<><NoIndexMeta /><ReportIssue /></>} />
        <Route path="/settings" element={<><NoIndexMeta /><UserSettings /></>} />
        <Route path="/map-picker" element={<><NoIndexMeta /><MapPicker /></>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
    </LazyChunkErrorBoundary>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-3 focus:font-bold focus:text-primary-foreground">Skip to content</a>
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <PwaInstallPrompt />
          <PwaUpdatePrompt />
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App
