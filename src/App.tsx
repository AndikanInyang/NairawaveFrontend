import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp, type Screen } from './context/AppContext';
import { DashboardSkeleton } from './components/Skeleton';

// Screens
import Login from './screens/Login';
import Register from './screens/Register';
import Dashboard from './screens/Dashboard';
import SendMoney from './screens/SendMoney';
import Receive from './screens/Receive';
import Airtime from './screens/Airtime';
import Data from './screens/Data';
import Bills from './screens/Bills';
import Transactions from './screens/Transactions';

// ─── Icons (unchanged — keep your existing icon components) ───────────────────

function IconHome({ cls }: { cls?: string }) {
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"
         strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  );
}

function IconSend({ cls }: { cls?: string }) {
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"
         strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22,2 15,22 11,13 2,9" />
    </svg>
  );
}

function IconDownload({ cls }: { cls?: string }) {
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"
         strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconPhone({ cls }: { cls?: string }) {
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"
         strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={2.5} />
    </svg>
  );
}

function IconBolt({ cls }: { cls?: string }) {
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"
         strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
    </svg>
  );
}

function IconList({ cls }: { cls?: string }) {
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"
         strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth={2.5} />
      <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth={2.5} />
      <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth={2.5} />
    </svg>
  );
}

function IconWifi({ cls }: { cls?: string }) {
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"
         strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth={3} />
    </svg>
  );
}

function IconLogout({ cls }: { cls?: string }) {
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"
         strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const BOTTOM_NAV = [
  { id: 'dashboard' as Screen, label: 'Home', Icon: IconHome },
  { id: 'send' as Screen, label: 'Send', Icon: IconSend },
  { id: 'receive' as Screen, label: 'Receive', Icon: IconDownload },
  { id: 'airtime' as Screen, label: 'Airtime', Icon: IconPhone },
  { id: 'bills' as Screen, label: 'Bills', Icon: IconBolt },
];

const SIDEBAR_NAV = [
  { id: 'dashboard' as Screen, label: 'Home', Icon: IconHome },
  { id: 'send' as Screen, label: 'Send Money', Icon: IconSend },
  { id: 'receive' as Screen, label: 'Receive Money', Icon: IconDownload },
  { id: 'airtime' as Screen, label: 'Buy Airtime', Icon: IconPhone },
  { id: 'data' as Screen, label: 'Buy Data', Icon: IconWifi },
  { id: 'bills' as Screen, label: 'Pay Bills', Icon: IconBolt },
  { id: 'transactions' as Screen, label: 'Transactions', Icon: IconList },
];

// ─── Auth Gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  // Full-screen loader while checking token
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse"
            style={{
              background: 'linear-gradient(135deg,#005A2F 0%,#003D20 100%)',
            }}
          >
            <span className="text-white font-bold text-lg font-display">NW</span>
          </div>
          <p className="text-muted text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authScreen === 'login' ? (
      <Login onSwitchToRegister={() => setAuthScreen('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthScreen('login')} />
    );
  }

  // Authenticated — render the banking app
  return (
    <AppProvider>
      <BankingShell />
    </AppProvider>
  );
}

// ─── Banking Shell (your existing layout, cleaned up) ─────────────────────────

function BankingShell() {
  const { screen, navigate, user, isLoadingAccounts } = useApp();
  const { logout } = useAuth();

  const renderScreen = () => {
    if (isLoadingAccounts) return <DashboardSkeleton />;

    switch (screen) {
      case 'send':         return <SendMoney />;
      case 'receive':      return <Receive />;
      case 'airtime':      return <Airtime />;
      case 'data':         return <Data />;
      case 'bills':        return <Bills />;
      case 'transactions': return <Transactions />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div className="flex h-full bg-surface overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-border">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg,#005A2F 0%,#003D20 100%)',
              }}
            >
              <span className="text-white font-bold text-sm font-display">NW</span>
            </div>
            <div>
              <p className="text-base font-bold text-ink font-display leading-none">
                NairaWave
              </p>
              <p className="text-xs text-muted mt-0.5">Digital Banking</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {SIDEBAR_NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm font-medium transition-all duration-150 ${
                  screen === id
                    ? 'bg-primary-50 text-primary font-semibold'
                    : 'text-muted hover:bg-surface hover:text-ink'
                }`}
            >
              <Icon cls="w-5 h-5 shrink-0" />
              <span>{label}</span>
              {screen === id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
              <span className="text-primary text-xs font-bold font-display">
                {user.initials}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
              <p className="text-xs text-muted truncate">{user.phone}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-sm font-medium text-danger hover:bg-danger/5 transition-all"
          >
            <IconLogout cls="w-5 h-5 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Content Column ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-border px-4 py-3
                           flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg,#005A2F 0%,#003D20 100%)',
              }}
            >
              <span className="text-white font-bold text-xs font-display">NW</span>
            </div>
            <span className="font-bold text-ink font-display">NairaWave</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="w-9 h-9 bg-surface rounded-full flex items-center justify-center"
              title="Sign out"
            >
              <IconLogout cls="w-4 h-4 text-muted" />
            </button>
            <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center">
              <span className="text-primary text-xs font-bold font-display">
                {user.initials}
              </span>
            </div>
          </div>
        </header>

        {/* Main scroll area */}
        <main className="flex-1 overflow-y-auto">{renderScreen()}</main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden bg-white border-t border-border flex shrink-0">
          {BOTTOM_NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                screen === id ? 'text-primary' : 'text-subtle'
              }`}
            >
              <Icon cls="w-5 h-5" />
              <span className="text-[10px] font-semibold">{label}</span>
              {screen === id && (
                <div className="w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}