import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Zap, FileVideo, BarChart3, Settings, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { TrendList } from './components/TrendList';
import { TrendDetail } from './components/TrendDetail';
import { SettingsModal } from './components/SettingsModal';
import { SavedIdeasPage } from './components/SavedIdeasPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { MOCK_TRENDS } from './mockData';
import { TrendCluster } from './types';
import { fetchTrendClusters, checkBackendHealth, API_BASE_URL } from './services/api';
import { useLanguage } from './LanguageContext';

type Page = 'dashboard' | 'saved' | 'analytics';

const App: React.FC = () => {
  const { t } = useLanguage();
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
    const maxRetries = 8;
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
          return;
        }
      } catch (err) {
        // Data not ready yet, will retry
      }

      if (retryCount < maxRetries) {
        retryCount++;
        setError(t.dashboard.loadingDataPipeline);
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
        setError(t.dashboard.noClustersFound);
        setTrends(MOCK_TRENDS);
        setSelectedTrend(MOCK_TRENDS[0]);
      }
    } catch (err) {
      setError(t.dashboard.failedToConnect);
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
      const response = await fetch(`${API_BASE_URL}/api/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || t.dashboard.failedToRefresh);
      }

      const result = await response.json();

      if (result.status === 'success') {
        setError(null);
      } else if (result.status === 'warning') {
        setError(result.message);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadRealData();

    } catch (err: any) {
      setError(err.message || t.dashboard.failedToRefresh);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  // Nav items config for DRY rendering
  const navItems: { id: Page; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: t.nav.dashboard },
    { id: 'saved', icon: <FileVideo className="w-5 h-5" />, label: t.nav.savedIdeas },
    { id: 'analytics', icon: <BarChart3 className="w-5 h-5" />, label: t.nav.analytics },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-[var(--color-bg-base)]">
      {/* ── Animated Mesh Gradient Background ── */}
      <div className="mesh-gradient" aria-hidden="true">
        <div className="mesh-gradient-extra" />
      </div>

      {/* ── Desktop Sidebar (lg+) ── */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 m-3 mr-0 rounded-2xl glass-prominent z-10 animate-slide-in-left">
        {/* Logo */}
        <div className="p-5 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-accent-blue)]/15 flex items-center justify-center ring-1 ring-[var(--color-accent-blue)]/25">
            <Zap className="w-[18px] h-[18px] text-[var(--color-accent-blue)]" fill="currentColor" />
          </div>
          <span className="font-serif text-xl tracking-tight text-[var(--color-text-primary)]">
            {t.appName}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 stagger-children">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  relative flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-xl
                  transition-all duration-200
                  ${isActive
                    ? 'bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-glass-hover)] hover:text-[var(--color-text-primary)]'
                  }
                `}
              >
                {/* Active left accent bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-[var(--color-accent-blue)] animate-fade-in" />
                )}
                <span className="ml-1">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Backend Status Pill */}
        <div className="px-3 pb-2">
          <div
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
              ${backendHealthy
                ? 'bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)] ring-1 ring-[var(--color-accent-green)]/20'
                : 'bg-[var(--color-accent-orange)]/10 text-[var(--color-accent-orange)] ring-1 ring-[var(--color-accent-orange)]/20'
              }
            `}
          >
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${
                backendHealthy ? 'bg-[var(--color-accent-green)]' : 'bg-[var(--color-accent-orange)]'
              }`}
            />
            <span>{backendHealthy ? t.status.backendConnected : t.status.usingMockData}</span>
          </div>
        </div>

        {/* Settings Button */}
        <div className="px-3 pb-3 pt-1 border-t border-[var(--color-border-glass)]">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 mt-2 text-sm font-medium rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-glass-hover)] hover:text-[var(--color-text-primary)] transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            {t.nav.settings}
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Header (below lg) ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 z-50 glass-prominent flex items-center justify-between px-4 animate-fade-in"
        style={{ borderBottom: '1px solid var(--color-border-glass)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent-blue)]/15 flex items-center justify-center ring-1 ring-[var(--color-accent-blue)]/25">
            <Zap className="w-4 h-4 text-[var(--color-accent-blue)]" fill="currentColor" />
          </div>
          <span className="font-serif text-lg text-[var(--color-text-primary)]">{t.appName}</span>
        </div>
        {/* Backend status mini pill on mobile header */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${
            backendHealthy
              ? 'bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)]'
              : 'bg-[var(--color-accent-orange)]/10 text-[var(--color-accent-orange)]'
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              backendHealthy ? 'bg-[var(--color-accent-green)]' : 'bg-[var(--color-accent-orange)]'
            }`}
          />
          <span className="hidden sm:inline">
            {backendHealthy ? t.status.backendConnected : t.status.usingMockData}
          </span>
        </div>
      </div>

      {/* ── Mobile Bottom Tab Bar (below lg) ── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-prominent animate-slide-up"
        style={{
          borderTop: '1px solid var(--color-border-glass)',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}
      >
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  flex flex-col items-center justify-center gap-0.5 flex-1 h-full
                  transition-colors duration-200 relative
                  ${isActive
                    ? 'text-[var(--color-accent-blue)]'
                    : 'text-[var(--color-text-tertiary)]'
                  }
                `}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
                {/* Active dot indicator */}
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--color-accent-blue)] animate-fade-in" />
                )}
              </button>
            );
          })}
          {/* Settings tab (opens modal, not a page) */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`
              flex flex-col items-center justify-center gap-0.5 flex-1 h-full
              transition-colors duration-200 text-[var(--color-text-tertiary)]
            `}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t.nav.settings}</span>
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative z-10 pt-14 pb-[4.5rem] lg:pt-0 lg:pb-0 min-w-0">

        {/* Show different pages based on currentPage */}
        {currentPage === 'saved' ? (
          <div className="flex-1 overflow-y-auto animate-fade-in">
            <SavedIdeasPage />
          </div>
        ) : currentPage === 'analytics' ? (
          <div className="flex-1 overflow-y-auto animate-fade-in">
            <AnalyticsPage trends={trends} />
          </div>
        ) : (
          <>
            {/* ── Trend List Sidebar — hidden on mobile, shown on md+ ── */}
            <div className="hidden md:flex flex-col w-72 lg:w-80 flex-shrink-0 border-r border-[var(--color-border-glass)] animate-slide-in-left">
              {/* Header */}
              <div className="p-4 border-b border-[var(--color-border-glass)] flex items-center justify-between">
                <h2 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest">
                  {useRealData ? t.dashboard.liveClusters : t.dashboard.activeClusters}
                </h2>
                {backendHealthy && (
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-bg-glass-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all duration-200 disabled:opacity-40"
                    title={t.dashboard.refreshData}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mx-3 mt-3 p-3 rounded-xl bg-[var(--color-accent-orange)]/8 ring-1 ring-[var(--color-accent-orange)]/20 flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-[var(--color-accent-orange)] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--color-accent-orange)]">{error}</p>
                </div>
              )}

              {/* Loading State */}
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-accent-blue)]/10 flex items-center justify-center mx-auto mb-3 animate-pulse-glow">
                      <Loader2 className="w-5 h-5 text-[var(--color-accent-blue)] animate-spin" />
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">{t.dashboard.loadingTrends}</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <TrendList
                    trends={trends}
                    selectedId={selectedTrend.id}
                    onSelect={(trend) => {
                      setSelectedTrend(trend);
                    }}
                  />
                </div>
              )}
            </div>

            {/* ── Mobile: Horizontal scrollable trend pills ── */}
            <div className="md:hidden flex-shrink-0 border-b border-[var(--color-border-glass)] overflow-x-auto scrollbar-none">
              <div className="flex gap-2 p-3 min-w-max stagger-children">
                {trends.map(trend => {
                  const isActive = trend.id === selectedTrend.id;
                  return (
                    <button
                      key={trend.id}
                      onClick={() => setSelectedTrend(trend)}
                      className={`
                        flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-medium
                        transition-all duration-200 animate-fade-in
                        ${isActive
                          ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] ring-1 ring-[var(--color-accent-blue)]/30'
                          : 'glass text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }
                      `}
                    >
                      {trend.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Mobile Error Banner ── */}
            {error && (
              <div className="md:hidden mx-3 mt-3 p-3 rounded-xl bg-[var(--color-accent-orange)]/8 ring-1 ring-[var(--color-accent-orange)]/20 flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-[var(--color-accent-orange)] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--color-accent-orange)]">{error}</p>
              </div>
            )}

            {/* ── Trend Detail Area ── */}
            <div className="flex-1 overflow-y-auto scroll-smooth min-w-0 animate-fade-in">
              {isLoading ? (
                <div className="flex-1 h-full flex items-center justify-center">
                  <div className="text-center animate-fade-in">
                    <div className="w-14 h-14 rounded-full bg-[var(--color-accent-blue)]/10 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                      <Loader2 className="w-7 h-7 text-[var(--color-accent-blue)] animate-spin" />
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">{t.dashboard.loadingTrends}</p>
                  </div>
                </div>
              ) : (
                <TrendDetail trend={selectedTrend} />
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Settings Modal ── */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApiKeySet={() => {
          if (backendHealthy) {
            loadRealData();
          }
        }}
      />
    </div>
  );
};

export default App;
