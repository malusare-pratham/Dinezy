import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';

import Login from '../pages/auth/Login';

import OwnerDashboard from '../pages/owner/OwnerDashboard';
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import CaptainDashboard from '../pages/captain/CaptainDashboard';
import KitchenDashboard from '../pages/kitchen/KitchenDashboard';
import Menu from '../pages/menu/Menu';
import TableView from '../pages/TableView/TableView';

import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/owner"
          element={<OwnerDashboard />}
        />

        <Route
          path="/manager"
          element={<ManagerDashboard />}
        />

        <Route
          path="/captain"
          element={
            <ProtectedRoute roles={['CAPTAIN']}>
              <CaptainDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kitchen"
          element={<KitchenDashboard />}
        />

        <Route
          path="/kitchen-display"
          element={<KitchenDashboard withSidebar={true} />}
        />

        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <Menu />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tables"
          element={<TableView withSidebar={true} />}
        />

      </Routes>

    </BrowserRouter>

  );
};

export default AppRoutes;
