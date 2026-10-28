import React, { useState } from 'react';
import { HomeGuardProvider, useHomeGuard } from './context/HomeGuardContext';
import { Header } from './components/Header';
import { DemoModeBanner } from './components/DemoModeBanner';
import { Navigation, NavView } from './components/Navigation';
import { HomeView } from './components/views/HomeView';
import { ActivityView } from './components/views/ActivityView';
import { SettingsView } from './components/views/SettingsView';
import { SimulationDrawer } from './components/SimulationDrawer';
import { ConnectModal } from './components/modals/ConnectModal';
import { MemberModal } from './components/modals/MemberModal';
import { Member } from './types';

const MainLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>('HOME');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isSimDrawerOpen, setIsSimDrawerOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  const { alerts } = useHomeGuard();
  const unacknowledgedAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  const handleOpenMemberModal = (member?: Member) => {
    setMemberToEdit(member || null);
    setIsMemberModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-charcoal-900 text-slate-100 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-200">
      {/* Top Header */}
      <Header
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onOpenSimModal={() => setIsSimDrawerOpen(true)}
      />

      {/* Demo Mode Notice & Quick Test Bench */}
      <DemoModeBanner
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onOpenSimModal={() => setIsSimDrawerOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 space-y-6">
        {/* Navigation Bar (Desktop top tabs) */}
        <div className="flex items-center justify-between">
          <Navigation
            currentView={currentView}
            onSelectView={setCurrentView}
            unacknowledgedAlertCount={unacknowledgedAlertsCount}
          />
        </div>

        {/* View Routing */}
        {currentView === 'HOME' && (
          <HomeView
            onNavigateToActivity={() => setCurrentView('ACTIVITY')}
            onOpenMemberModal={() => handleOpenMemberModal()}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
          />
        )}

        {currentView === 'ACTIVITY' && <ActivityView />}

        {currentView === 'SETTINGS' && (
          <SettingsView
            onOpenMemberModal={handleOpenMemberModal}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
          />
        )}
      </main>

      {/* Modals and Simulation Drawers */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      <SimulationDrawer
        isOpen={isSimDrawerOpen}
        onClose={() => setIsSimDrawerOpen(false)}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
      />

      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        memberToEdit={memberToEdit}
      />
    </div>
  );
};

export function App() {
  return (
    <HomeGuardProvider>
      <MainLayout />
    </HomeGuardProvider>
  );
}

export default App;
