import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Zap, FileVideo, BarChart3, Settings, Menu, X, AlertCircle, RefreshCw } from 'lucide-react';
import { TrendList } from './components/TrendList';
import { TrendDetail } from './components/TrendDetail';
import { SettingsModal } from './components/SettingsModal';
import { SavedIdeasPage } from './components/SavedIdeasPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { MOCK_TRENDS } from './mockData';
import { TrendCluster } from './types';
import { fetchTrendClusters, checkBackendHealth, API_BASE_URL } from './services/api';

type Page = 'dashboard' | 'saved' | 'analytics';

const App: React.FC = () => {
  const [selectedTrend, setSelectedTrend] = useState<TrendCluster>(MOCK_TRENDS[0]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [trends, setTrends] = useState<TrendCluster[]>(MOCK_TRENDS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useRealData, setUseRealData] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check backend health on mount, retry if pipeline is still running
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 8; // ~2 minutes of retrying
    let retryTimer: ReturnType<typeof setTimeout>;

    const tryLoadData = async () => {
      const healthy = await checkBackendHealth();
      setBackendHealthy(healthy);

      if (!healthy) {
        if (retryCount < maxRetries) {
          retryCount++;
          retryTimer = setTimeout(tryLoadData, 15000);
        } else {
          setIsLoading(false);
        }
        return;
      }

      try {
        const clusters = await fetchTrendClusters();
        if (clusters.length > 0) {
          setTrends(clusters);
          setSelectedTrend(clusters[0]);
          setUseRealData(true);
          setError(null);
          setIsLoading(false);
          return; // Success — stop retrying
        }
      } catch (err) {
        console.log('Data not ready yet, will retry...');
      }

      // No clusters yet — pipeline may still be running, retry
      if (retryCount < maxRetries) {
        retryCount++;
        setError('Loading data from API... Pipeline may still be running.');
        setIsLoading(false);
        retryTimer = setTimeout(tryLoadData, 15000);
      } else {
        setError(null);
        setIsLoading(false);
      }
    };

    tryLoadData();

    return () => clearTimeout(retryTimer);
  }, []);

  const loadRealData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const clusters = await fetchTrendClusters();

      if (clusters.length > 0) {
        setTrends(clusters);
        setSelectedTrend(clusters[0]);
        setUseRealData(true);
      } else {
        setError('No clusters found. Backend may need data ingestion.');
        setTrends(MOCK_TRENDS);
        setSelectedTrend(MOCK_TRENDS[0]);
      }
    } catch (err) {
      console.error('Failed to load real data:', err);
      setError('Failed to connect to backend. Using mock data.');
      setTrends(MOCK_TRENDS);
      setSelectedTrend(MOCK_TRENDS[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!backendHealthy) return;

    setIsRefreshing(true);
    setError(null);

    try {
      // Trigger backend data refresh
      const response = await fetch(`${API_BASE_URL}/api/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'Failed to refresh data');
      }

      const result = await response.json();
      console.log('Refresh result:', result);

      // Show success message
      if (result.status === 'success') {
        setError(null);
      } else if (result.status === 'warning') {
        setError(result.message);
      }

      // Wait a moment for data to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reload the data
      await loadRealData();

    } catch (err: any) {
      console.error('Refresh failed:', err);
      setError(err.message || 'Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="font-bold text-xl tracking-tight">TrendPulse</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === 'dashboard'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setCurrentPage('saved')}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === 'saved'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
          >
            <FileVideo className="w-4 h-4" />
            Saved Ideas
          </button>
          <button
            onClick={() => setCurrentPage('analytics')}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === 'analytics'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </nav>

        {/* Backend Status Indicator */}
        <div className="px-4 pb-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${backendHealthy
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
            <div className={`w-2 h-2 rounded-full ${backendHealthy ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
            <span className="font-medium">
              {backendHealthy ? 'Backend Connected' : 'Using Mock Data'}
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="font-bold text-lg">TrendPulse</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-400">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative pt-16 md:pt-0">

        {/* Show different pages based on currentPage */}
        {currentPage === 'saved' ? (
          <SavedIdeasPage />
        ) : currentPage === 'analytics' ? (
          <AnalyticsPage trends={trends} />
        ) : (
          <>
            {/* Trend List Column */}
            <div className={`
              absolute md:relative inset-0 z-40 bg-zinc-950 md:bg-transparent md:w-80 border-r border-zinc-800 flex flex-col
              transition-transform duration-300 ease-in-out
              ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                  {useRealData ? 'Live Clusters' : 'Active Clusters'}
                </h2>
                {backendHealthy && (
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                    title="Refresh data from API"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mx-2 mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">{error}</p>
                </div>
              )}

              {/* Loading State */}
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-zinc-400">Loading trends...</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <TrendList
                    trends={trends}
                    selectedId={selectedTrend.id}
                    onSelect={(trend) => {
                      setSelectedTrend(trend);
                      setIsMobileMenuOpen(false);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Trend Detail Area */}
            <div className="flex-1 overflow-y-auto bg-zinc-950/50 scroll-smooth">
              <TrendDetail trend={selectedTrend} />
            </div>
          </>
        )}

      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApiKeySet={() => {
          // Refresh data after API key is set
          if (backendHealthy) {
            loadRealData();
          }
        }}
      />
    </div>
  );
};

export default App;
