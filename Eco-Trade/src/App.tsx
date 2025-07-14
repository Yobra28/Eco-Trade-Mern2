import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import MarketplacePage from './pages/MarketplacePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ChatPage from './pages/ChatPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import socket from './services/socket';

function AppContent() {
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) return;
    socket.onNewMessageNotification((data) => {
      toast.info('📩 New message received!');
    });
    socket.onItemStatusNotification((data) => {
      toast.info(`Item status changed: ${data.status}`);
    });
    socket.onTradeRequestNotification((data) => {
      toast.info(`🔔 New trade request for your item: ${data.itemTitle}`);
    });
    socket.onTradeRequestStatusNotification((data) => {
      toast.info(`🔔 Your trade request for ${data.itemTitle} was ${data.status}`);
    });
    socket.onTradeCompletedNotification((data) => {
      toast.success(`✅ Trade completed for item: ${data.itemTitle}`);
    });
    return () => {
      socket.offNewMessageNotification();
      socket.offItemStatusNotification();
      socket.offTradeRequestNotification();
      socket.offTradeRequestStatusNotification();
      socket.offTradeCompletedNotification();
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={4000} aria-label="Notification Toasts" />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/dashboard" />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/auth" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboardPage /> : <Navigate to="/dashboard" />} />
        <Route path="/chat" element={user ? <ChatPage /> : <Navigate to="/auth" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;