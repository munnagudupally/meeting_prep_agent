import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { ContactDetailsPage } from './pages/ContactDetailsPage';
import { MeetingHistoryPage } from './pages/MeetingHistoryPage';
import { MeetingCreatePage } from './pages/MeetingCreatePage';
import { MeetingBriefPage } from './pages/MeetingBriefPage';
import { MemoryTimelinePage } from './pages/MemoryTimelinePage';
import { CommitmentsPage } from './pages/CommitmentsPage';
import { PostMeetingPage } from './pages/PostMeetingPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* 1. Dashboard */}
          <Route index element={<DashboardPage />} />

          {/* 2. Contacts */}
          <Route path="contacts" element={<ContactsPage />} />

          {/* 3. Contact Details */}
          <Route path="contacts/:id" element={<ContactDetailsPage />} />

          {/* 4. Meeting History */}
          <Route path="meetings" element={<MeetingHistoryPage />} />

          {/* 5. Meeting Creation */}
          <Route path="meetings/new" element={<MeetingCreatePage />} />

          {/* 6. Meeting Brief (Most Important Screen) */}
          <Route path="meetings/:id/brief" element={<MeetingBriefPage />} />

          {/* 7. Memory Timeline */}
          <Route path="timeline" element={<MemoryTimelinePage />} />

          {/* 8. Commitment UI */}
          <Route path="commitments" element={<CommitmentsPage />} />

          {/* 9. Post-Meeting Input */}
          <Route path="meetings/:id/post-meeting" element={<PostMeetingPage />} />

          {/* Catch-all */}
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
