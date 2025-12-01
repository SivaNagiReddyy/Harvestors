import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MachineOwners from './pages/MachineOwners';
import Machines from './pages/Machines';
import Farmers from './pages/Farmers';
import Fields from './pages/Fields';
import Jobs from './pages/Jobs';
import Expenses from './pages/Expenses';
import Payments from './pages/Payments';
import Discounts from './pages/Discounts';
import Dealers from './pages/Dealers';
import MachineRentals from './pages/MachineRentals';
import RentalPayments from './pages/RentalPayments';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/machine-owners" element={<MachineOwners />} />
                    <Route path="/machines" element={<Machines />} />
                    <Route path="/farmers" element={<Farmers />} />
                    <Route path="/fields" element={<Fields />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/discounts" element={<Discounts />} />
                    <Route path="/dealers" element={<Dealers />} />
                    <Route path="/machine-rentals" element={<MachineRentals />} />
                    <Route path="/rental-payments" element={<RentalPayments />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
