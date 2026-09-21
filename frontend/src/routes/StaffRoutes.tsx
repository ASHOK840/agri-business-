import { Routes, Route, Navigate } from 'react-router-dom';
import StaffHomePage from '../pages/staff/StaffHomePage';
import StaffAddEntryPage from '../pages/staff/StaffAddEntryPage';
import StaffEntriesListPage from '../pages/staff/StaffEntriesListPage';
import RoleRoute from './RoleRoute';

// The entire Staff surface — three screens, nothing else. Anything not
// listed here (inventory, accounting, reports, etc.) simply doesn't
// exist in this tree, and the backend independently blocks the APIs too.
const StaffRoutes = () => {
  return (
    <Routes>
      <Route
        path="/staff"
        element={
          <RoleRoute allowedRoles={['STAFF']}>
            <StaffHomePage />
          </RoleRoute>
        }
      />
      <Route
        path="/staff/add-entry"
        element={
          <RoleRoute allowedRoles={['STAFF']}>
            <StaffAddEntryPage />
          </RoleRoute>
        }
      />
      <Route
        path="/staff/entries"
        element={
          <RoleRoute allowedRoles={['STAFF']}>
            <StaffEntriesListPage />
          </RoleRoute>
        }
      />
      <Route path="*" element={<Navigate to="/staff" replace />} />
    </Routes>
  );
};

export default StaffRoutes;
