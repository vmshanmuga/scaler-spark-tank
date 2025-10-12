import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DropshippingLoader from './DropshippingLoader';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();

  // Show loader while checking authentication
  if (loading) {
    return <DropshippingLoader />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if admin access is required
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/home" replace />;
  }

  // Render protected content
  return <>{children}</>;
}
