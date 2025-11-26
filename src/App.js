import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Layout/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import ManageUsers from './pages/Admin/ManageUsers';
import ManageEmployees from './pages/Admin/ManageEmployees';
import ActivityLogs from './pages/Admin/ActivityLogs';
import CardTemplates from './pages/Admin/CardTemplates';
import OfferLetterGenerator from './pages/Admin/OfferLetterGenerator';
import OfferLetterRecords from './pages/Admin/OfferLetterRecords';
import AppointmentLetterGenerator from './pages/Admin/AppointmentLetterGenerator';
import AppointmentLetterRecords from './pages/Admin/AppointmentLetterRecords';
import VisitingCardRecords from './pages/Admin/VisitingCardRecords';

// Employee Pages
import EmployeeDashboard from './pages/Employee/Dashboard';
import VisitingCard from './pages/Employee/VisitingCard';
import VisitorCard from './pages/Employee/VisitorCard';
import VisitorHistory from './pages/Employee/VisitorHistory';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ManageUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ManageEmployees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/templates"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CardTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/offer-letters"
              element={
                <ProtectedRoute requiredRole="admin">
                  <OfferLetterGenerator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointment-letters"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppointmentLetterGenerator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/offer-letter-records"
              element={
                <ProtectedRoute requiredRole="admin">
                  <OfferLetterRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointment-letter-records"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppointmentLetterRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/visiting-card-records"
              element={
                <ProtectedRoute requiredRole="admin">
                  <VisitingCardRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ActivityLogs />
                </ProtectedRoute>
              }
            />

            {/* Employee Routes */}
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/visiting-card"
              element={
                <ProtectedRoute>
                  <VisitingCard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/visitor-card"
              element={
                <ProtectedRoute>
                  <VisitorCard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/visitor-history"
              element={
                <ProtectedRoute>
                  <VisitorHistory />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
