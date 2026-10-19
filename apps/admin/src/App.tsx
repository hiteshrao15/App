import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Stores } from './pages/Stores';
import { Offers } from './pages/Offers';
import { Redemptions } from './pages/Redemptions';
import { DryDays } from './pages/DryDays';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

const AdminLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const getPageMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Executive Overview', subtitle: 'Live marketplace metrics and performance indicators' };
      case 'stores':
        return { title: 'Store & Excise Licenses', subtitle: 'Manage authorized retail outlets and compliance verifications' };
      case 'offers':
        return { title: 'Promotional Offers & Discounts', subtitle: 'Configure percentage off, flat discounts, and BOGO campaigns' };
      case 'redemptions':
        return { title: 'Redemption Terminal & Ledger', subtitle: 'Instant POS verification and immutable anti-replay ledger' };
      case 'drydays':
        return { title: 'Excise Dry Days Calendar', subtitle: 'Schedule statutory non-operational days across states' };
      case 'settings':
        return { title: 'System Controls & Compliance', subtitle: 'Configure legal drinking age rules, tokens, and integrations' };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="admin-layout">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      <div className="main-wrapper">
        <Header title={meta.title} subtitle={meta.subtitle} />
        <main className="content-body">
          {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
          {activeTab === 'stores' && <Stores />}
          {activeTab === 'offers' && <Offers />}
          {activeTab === 'redemptions' && <Redemptions />}
          {activeTab === 'drydays' && <DryDays />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AdminLayout />
    </AuthProvider>
  );
};

export default App;
