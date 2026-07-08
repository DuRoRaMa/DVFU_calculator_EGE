import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import {
  getCurrentUserFromStorage,
  hasAuthTokens,
  isAdminUser,
} from '../../services/api';

const ProtectedRoute = ({
  children,
  currentUser = null,
  requireAdmin = false,
}) => {
  const location = useLocation();

  const user = currentUser || getCurrentUserFromStorage();

  if (!hasAuthTokens()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (requireAdmin && !isAdminUser(user)) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;