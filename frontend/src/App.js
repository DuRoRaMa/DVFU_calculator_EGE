import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';

import Header from './components/Layout/Header';
import ProgramSelector from './components/Program/ProgramSelector';
import CalculatorPage from './pages/CalculatorPage';
import ScenarioPage from './pages/ScenarioPage';
import Loader from './components/Common/Loader';
import ErrorAlert from './components/Common/ErrorAlert';
import Login from './components/Auth/Login';
import AdminAnalyticsPanel from './components/Admin/AdminAnalyticsPanel';
import ProtectedRoute from './components/Auth/ProtectedRoute';

import {
  clearAuthTokens,
  getDirectionStats,
  getPrograms,
  hasAuthTokens,
} from './services/api';

const theme = createTheme({
  palette: {
    primary: {
      main: '#003366',
    },
    secondary: {
      main: '#ff9900',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const attachMonitoringStats = (programs, directionStats) => {
  const statsByCode = new Map();

  directionStats.forEach((item) => {
    if (!statsByCode.has(item.direction_code)) {
      statsByCode.set(item.direction_code, item);
    }
  });

  return programs.map((program) => ({
    ...program,
    monitoring: statsByCode.get(program.code) || null,
  }));
};

const AppContent = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(hasAuthTokens());

  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);

  const [loading, setLoading] = useState(hasAuthTokens());
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthLogin = () => {
      setIsAuthenticated(true);
    };

    const handleAuthLogout = () => {
      setIsAuthenticated(false);
      setPrograms([]);
      setSelectedProgram(null);
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadPrograms = async () => {
      try {
        setLoading(true);
        setError(null);

        const [programsResponse, statsResponse] = await Promise.all([
          getPrograms(),
          getDirectionStats(),
        ]);

        const programsWithStats = attachMonitoringStats(
          programsResponse.data,
          statsResponse.data
        );

        setPrograms(programsWithStats);
      } catch (err) {
        console.error(err);
        setError('Ошибка загрузки программ');
      } finally {
        setLoading(false);
      }
    };

    loadPrograms();
  }, [isAuthenticated]);

  const handleSelectProgram = (program) => {
    setSelectedProgram(program);
    setError(null);
  };

  const handleLogout = () => {
    clearAuthTokens();
    setIsAuthenticated(false);
    setSelectedProgram(null);
    setPrograms([]);
    navigate('/login', { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login onLogin={() => setIsAuthenticated(true)} />
          )
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <>
              <Header onLogout={handleLogout} />

              <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                {error && (
                  <ErrorAlert
                    message={error}
                    onClose={() => setError(null)}
                  />
                )}

                {loading ? (
                  <Loader />
                ) : (
                  <>
                    <AdminAnalyticsPanel />

                    <ProgramSelector
                      programs={programs}
                      selectedProgram={selectedProgram}
                      onSelectProgram={handleSelectProgram}
                    />
                  </>
                )}
              </Container>
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/calculate/:programId"
        element={
          <ProtectedRoute>
            <>
              <Header onLogout={handleLogout} />

              <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                {error && (
                  <ErrorAlert
                    message={error}
                    onClose={() => setError(null)}
                  />
                )}

                {loading ? (
                  <Loader />
                ) : selectedProgram ? (
                  <CalculatorPage
                    program={selectedProgram}
                    onError={setError}
                  />
                ) : (
                  <Navigate to="/" replace />
                )}
              </Container>
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/scenario/:programId"
        element={
          <ProtectedRoute>
            <>
              <Header onLogout={handleLogout} />

              <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                {error && (
                  <ErrorAlert
                    message={error}
                    onClose={() => setError(null)}
                  />
                )}

                {loading ? (
                  <Loader />
                ) : selectedProgram ? (
                  <ScenarioPage
                    program={selectedProgram}
                    onError={setError}
                  />
                ) : (
                  <Navigate to="/" replace />
                )}
              </Container>
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          hasAuthTokens() ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
