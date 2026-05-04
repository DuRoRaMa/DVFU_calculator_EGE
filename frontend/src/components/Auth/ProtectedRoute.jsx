import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { hasAuthTokens } from '../../services/api';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!hasAuthTokens()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
