import React, { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
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
import RecommendationsPage from './pages/RecommendationsPage';
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

const ProgramRoute = ({ programs, selectedProgram, onSelectProgram, children }) => {
  const { programId } = useParams();

  const routeProgram = useMemo(() => {
    if (selectedProgram?.id?.toString() === programId?.toString()) {
      return selectedProgram;
    }

    return programs.find((program) => program.id?.toString() === programId?.toString()) || null;
  }, [programId, programs, selectedProgram]);

  useEffect(() => {
    if (routeProgram && selectedProgram?.id !== routeProgram.id) {
      onSelectProgram(routeProgram);
    }
  }, [routeProgram, selectedProgram, onSelectProgram]);

  if (!routeProgram) {
    return <Navigate to="/" replace />;
  }

  return children(routeProgram);
};

const ProtectedLayout = ({ onLogout, children }) => (
  <ProtectedRoute>
    <Header onLogout={onLogout} />
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {children}
    </Container>
  </ProtectedRoute>
);

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
            <Container maxWidth="sm" sx={{ py: 8 }}>
              <Login setToken={() => setIsAuthenticated(true)} />
            </Container>
          )
        }
      />

      <Route
        path="/"
        element={
          <ProtectedLayout onLogout={handleLogout}>
            {error && <ErrorAlert error={error} onClose={() => setError(null)} />}
            {loading ? (
              <Loader message="Загрузка направлений..." />
            ) : (
              <ProgramSelector
                programs={programs}
                selectedProgram={selectedProgram}
                onSelectProgram={handleSelectProgram}
              />
            )}
          </ProtectedLayout>
        }
      />

      <Route
        path="/calculate/:programId"
        element={
          <ProtectedLayout onLogout={handleLogout}>
            {error && <ErrorAlert error={error} onClose={() => setError(null)} />}
            {loading ? (
              <Loader message="Загрузка направления..." />
            ) : (
              <ProgramRoute
                programs={programs}
                selectedProgram={selectedProgram}
                onSelectProgram={handleSelectProgram}
              >
                {(program) => <CalculatorPage program={program} onError={setError} />}
              </ProgramRoute>
            )}
          </ProtectedLayout>
        }
      />

      <Route
        path="/recommendations/:programId"
        element={
          <ProtectedLayout onLogout={handleLogout}>
            {error && <ErrorAlert error={error} onClose={() => setError(null)} />}
            {loading ? (
              <Loader message="Загрузка направления..." />
            ) : (
              <ProgramRoute
                programs={programs}
                selectedProgram={selectedProgram}
                onSelectProgram={handleSelectProgram}
              >
                {(program) => <RecommendationsPage program={program} onError={setError} />}
              </ProgramRoute>
            )}
          </ProtectedLayout>
        }
      />

      <Route
        path="/scenario/:programId"
        element={
          <ProtectedLayout onLogout={handleLogout}>
            {error && <ErrorAlert error={error} onClose={() => setError(null)} />}
            {loading ? (
              <Loader message="Загрузка направления..." />
            ) : (
              <ProgramRoute
                programs={programs}
                selectedProgram={selectedProgram}
                onSelectProgram={handleSelectProgram}
              >
                {(program) => <ScenarioPage program={program} onError={setError} />}
              </ProgramRoute>
            )}
          </ProtectedLayout>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedLayout onLogout={handleLogout}>
            <AdminAnalyticsPanel />
          </ProtectedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
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
