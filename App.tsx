import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardView } from './components/DashboardView';
import { ScanView } from './components/ScanView';
import { LoginView } from './components/LoginView';
import { SignupView } from './components/SignupView';
import { FamilySettingsView } from './components/FamilySettingsView';
import { CategorySettingsView } from './components/CategorySettingsView';

import { Tooltip } from './components/Tooltip';

const MainLayout = () => {
  const { currentView, setView } = useApp();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar for Desktop */}
      <nav className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 h-screen sticky top-0 p-6 space-y-8 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">HomeEcon</span>
        </div>

        <div className="space-y-2">
          <Tooltip content="View your financial overview" position="right">
            <NavButton
              active={currentView === 'dashboard'}
              onClick={() => setView('dashboard')}
              icon={<HomeIcon />}
              label="Dashboard"
            />
          </Tooltip>
          <Tooltip content="Scan receipts with AI" position="right">
            <NavButton
              active={currentView === 'scan'}
              onClick={() => setView('scan')}
              icon={<ScanIcon />}
              label="Smart Scan"
            />
          </Tooltip>
          <Tooltip content="Manage budget categories" position="right">
            <NavButton
              active={currentView === 'categories'}
              onClick={() => setView('categories')}
              icon={<ChartIcon />}
              label="Categories"
            />
          </Tooltip>
          <Tooltip content="Manage family and app settings" position="right">
            <NavButton
              active={currentView === 'settings'}
              onClick={() => setView('settings')}
              icon={<SettingsIcon />}
              label="Settings"
            />
          </Tooltip>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100">
            <p className="text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center">
              <span className="bg-emerald-200 p-1 rounded mr-2">💡</span> Pro Tip
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Scanning receipts daily improves budget accuracy by 35%.
            </p>
          </div>

          <Tooltip content="Sign out of your account" position="right">
            <button
              onClick={signOut}
              className="flex items-center space-x-3 w-full p-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogoutIcon />
              <span>Sign Out</span>
            </button>
          </Tooltip>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">H</span>
          </div>
          <span className="text-lg font-bold text-slate-800">HomeEcon</span>
        </div>
        <button onClick={signOut} className="text-slate-400 hover:text-red-500">
          <LogoutIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto h-[calc(100vh-60px)] md:h-screen scroll-smooth">
        <div className="max-w-6xl mx-auto w-full">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'scan' && <ScanView />}
          {currentView === 'categories' && <CategorySettingsView />}
          {currentView === 'settings' && <FamilySettingsView />}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-2 pb-safe z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <MobileNavButton
          active={currentView === 'dashboard'}
          onClick={() => setView('dashboard')}
          icon={<HomeIcon />}
          label="Home"
        />
        <div className="relative -top-8">
          <button
            onClick={() => setView('scan')}
            className="bg-emerald-600 text-white p-4 rounded-full shadow-xl shadow-emerald-200 transform transition active:scale-95 border-4 border-slate-50 hover:bg-emerald-500"
          >
            <ScanIcon className="w-8 h-8" />
          </button>
        </div>
        <MobileNavButton
          active={currentView === 'categories'}
          onClick={() => setView('categories')}
          icon={<ChartIcon />}
          label="Budget"
        />
        <MobileNavButton
          active={currentView === 'settings'}
          onClick={() => setView('settings')}
          icon={<SettingsIcon />}
          label="Settings"
        />
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = React.useState(true);

  if (!user) {
    return isLogin
      ? <LoginView onToggleMode={() => setIsLogin(false)} />
      : <SignupView onToggleMode={() => setIsLogin(true)} />;
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

// Icons
const HomeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ScanIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h-4v-4H8m16 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SettingsIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200 group ${active
      ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm'
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
  >
    <span className={`transition-colors ${active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
      {icon}
    </span>
    <span>{label}</span>
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center space-y-1 p-2 rounded-lg active:bg-slate-50 ${active ? 'text-emerald-600' : 'text-slate-400'}`}
  >
    {icon}
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);

export default App;