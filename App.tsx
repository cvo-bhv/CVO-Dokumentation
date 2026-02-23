import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { IncidentsList } from './pages/IncidentsList';
import { IncidentForm } from './pages/IncidentForm';
import { ProtocolList } from './pages/ProtocolList';
import { ProtocolForm } from './pages/ProtocolForm';
import { MeetingMinutesList } from './pages/MeetingMinutesList';
import { MeetingMinuteForm } from './pages/MeetingMinuteForm';
import { MeetingMinutePrint } from './pages/MeetingMinutePrint';
import { StructureManager } from './pages/StructureManager';
import { SettingsPage } from './pages/SettingsPage';
import { PrintView } from './pages/PrintView';

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/print" element={<PrintView />} />
        <Route path="/print-meeting" element={<MeetingMinutePrint />} />
        <Route path="/incidents/new" element={<AppLayout><IncidentForm /></AppLayout>} />
        <Route path="/incidents/edit/:id" element={<AppLayout><IncidentForm /></AppLayout>} />
        <Route path="/incidents" element={<AppLayout><IncidentsList /></AppLayout>} />
        
        <Route path="/protocols/new" element={<AppLayout><ProtocolForm /></AppLayout>} />
        <Route path="/protocols/edit/:id" element={<AppLayout><ProtocolForm /></AppLayout>} />
        <Route path="/protocols" element={<AppLayout><ProtocolList /></AppLayout>} />

        <Route path="/meetings/new" element={<AppLayout><MeetingMinuteForm /></AppLayout>} />
        <Route path="/meetings/edit/:id" element={<AppLayout><MeetingMinuteForm /></AppLayout>} />
        <Route path="/meetings" element={<AppLayout><MeetingMinutesList /></AppLayout>} />

        <Route path="/structure" element={<AppLayout><StructureManager /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
        <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="*" element={<AppLayout><Dashboard /></AppLayout>} />
      </Routes>
    </HashRouter>
  );
};

export default App;