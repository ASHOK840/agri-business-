import { Routes, Route, Navigate } from 'react-router-dom';
import MyTripsPage from '../pages/myTrips/MyTripsPage';
import RoleRoute from './RoleRoute';

// The entire Transportation surface — one screen: their own trips.
const TransportRoutes = () => {
  return (
    <Routes>
      <Route
        path="/transport"
        element={
          <RoleRoute allowedRoles={['TRANSPORTATION']}>
            <MyTripsPage />
          </RoleRoute>
        }
      />
      <Route path="*" element={<Navigate to="/transport" replace />} />
    </Routes>
  );
};

export default TransportRoutes;
