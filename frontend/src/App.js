import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
  getMe,
  getPrograms,
  getPublicDirectionMonitoring,
  hasAuthTokens,
  saveCurrentUser,
} from './services/api';

const theme = createTheme({
  typography: {
    fontFamily: "'Tilda Sans', Arial, sans-serif",
    h1: {
      fontFamily: "'Unbounded', 'Tilda Sans', Arial, sans-serif",
      fontWeight: 800,
      letterSpacing: '-0.04em',
    },
    h2: {
      fontFamily: "'Unbounded', 'Tilda Sans', Arial, sans-serif",
      fontWeight: 800,
      letterSpacing: '-0.04em',
    },
    h3: {
      fontFamily: "'Unbounded', 'Tilda Sans', Arial, sans-serif",
      fontWeight: 800,
      letterSpacing: '-0.04em',
    },
    h4: {
      fontFamily: "'Unbounded', 'Tilda Sans', Arial, sans-serif",
      fontWeight: 800,
      letterSpacing: '-0.04em',
    },
    h5: {
      fontFamily: "'Unbounded', 'Tilda Sans', Arial, sans-serif",
      fontWeight: 800,
      letterSpacing: '-0.035em',
    },
    h6: {
      fontFamily: "'Unbounded', 'Tilda Sans', Arial, sans-serif",
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    button: {
      fontFamily: "'Tilda Sans', Arial, sans-serif",
      fontWeight: 700,
      textTransform: 'none',
    },
  },

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
    const directionCode = item?.direction_code;

    if (!directionCode) {
      return;
    }

    if (!statsByCode.has(directionCode)) {
      statsByCode.set(directionCode, item);
    }
  });

  return programs.map((program) => ({
    ...program,
    monitoring: statsByCode.get(program.code) || null,
  }));
};

const ProgramRoute = ({
  programs,
  selectedProgram,
  onSelectProgram,
  children,
}) => {
  const { programId } = useParams();

  const routeProgram = useMemo(() => {
    if (selectedProgram?.id?.toString() === programId?.toString()) {
      return selectedProgram;
    }

    return (
      programs.find(
        (program) => program.id?.toString() === programId?.toString()
      ) || null
    );
  }, [
    programId,
    programs,
    selectedProgram,
  ]);

  useEffect(() => {
    if (
      routeProgram &&
      selectedProgram?.id !== routeProgram.id
    ) {
      onSelectProgram(routeProgram);
    }
  }, [
    routeProgram,
    selectedProgram,
    onSelectProgram,
  ]);

  if (!routeProgram) {
    return <Navigate to="/" replace />;
  }

  return children(routeProgram);
};

const ProtectedLayout = ({
  currentUser,
  onLogout,
  children,
}) => (
  <>
    <Header
      currentUser={currentUser}
      onLogout={onLogout}
    />

    <Container maxWidth="xl" sx={{ py: 4 }}>
      {children}
    </Container>
  </>
);

const AppContent = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(
    hasAuthTokens()
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(hasAuthTokens());
  const [error, setError] = useState(null);

  const resetSessionState = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPrograms([]);
    setSelectedProgram(null);
  }, []);

  useEffect(() => {
    const handleAuthLogin = () => {
      setIsAuthenticated(true);
    };

    const handleAuthLogout = () => {
      resetSessionState();
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [resetSessionState]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const userResponse = await getMe();
        const user = userResponse.data;

        setCurrentUser(user);
        saveCurrentUser(user);

        const programsResponse = await getPrograms();
        const loadedPrograms = Array.isArray(programsResponse.data)
          ? programsResponse.data
          : [];

        let directionStats = [];

        try {
          const monitoringResponse =
            await getPublicDirectionMonitoring();

          directionStats = Array.isArray(monitoringResponse.data)
            ? monitoringResponse.data
            : [];
        } catch (monitoringError) {
          console.error(
            'Не удалось загрузить общедоступный мониторинг ВПП:',
            monitoringError
          );

          directionStats = [];
        }

        const programsWithMonitoring = attachMonitoringStats(
          loadedPrograms,
          directionStats
        );

        setPrograms(programsWithMonitoring);

        setSelectedProgram((currentSelectedProgram) => {
          if (!currentSelectedProgram) {
            return null;
          }

          return (
            programsWithMonitoring.find(
              (program) =>
                program.id?.toString() ===
                currentSelectedProgram.id?.toString()
            ) || null
          );
        });
      } catch (err) {
        console.error(err);

        if (err.response?.status === 401) {
          clearAuthTokens();
          resetSessionState();

          navigate('/login', {
            replace: true,
          });

          return;
        }

        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [
    isAuthenticated,
    navigate,
    resetSessionState,
  ]);

  const handleSelectProgram = useCallback((program) => {
    setSelectedProgram(program);
    setError(null);
  }, []);

  const handleLogout = () => {
    clearAuthTokens();
    resetSessionState();

    navigate('/login', {
      replace: true,
    });
  };

  const handleLogin = (user) => {
    if (user) {
      setCurrentUser(user);
      saveCurrentUser(user);
    }

    setIsAuthenticated(true);
  };

  const renderProtectedContent = (
    content,
    requireAdmin = false
  ) => {
    return (
      <ProtectedRoute
        currentUser={currentUser}
        requireAdmin={requireAdmin}
      >
        <ProtectedLayout
          currentUser={currentUser}
          onLogout={handleLogout}
        >
          {error && (
            <ErrorAlert
              message={error}
              onClose={() => setError(null)}
            />
          )}

          {loading ? <Loader /> : content}
        </ProtectedLayout>
      </ProtectedRoute>
    );
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      <Route
        path="/"
        element={renderProtectedContent(
          <ProgramSelector
            programs={programs}
            onSelectProgram={handleSelectProgram}
          />
        )}
      />

      <Route
        path="/calculate/:programId"
        element={renderProtectedContent(
          <ProgramRoute
            programs={programs}
            selectedProgram={selectedProgram}
            onSelectProgram={handleSelectProgram}
          >
            {(program) => (
              <CalculatorPage
                program={program}
                onError={setError}
              />
            )}
          </ProgramRoute>
        )}
      />

      <Route
        path="/scenario/:programId"
        element={renderProtectedContent(
          <ProgramRoute
            programs={programs}
            selectedProgram={selectedProgram}
            onSelectProgram={handleSelectProgram}
          >
            {(program) => (
              <ScenarioPage program={program} />
            )}
          </ProgramRoute>
        )}
      />

      <Route
        path="/recommendations/:programId"
        element={renderProtectedContent(
          <ProgramRoute
            programs={programs}
            selectedProgram={selectedProgram}
            onSelectProgram={handleSelectProgram}
          >
            {(program) => (
              <RecommendationsPage
                program={program}
                onError={setError}
              />
            )}
          </ProgramRoute>
        )}
      />

      <Route
        path="/statistics"
        element={renderProtectedContent(
          <AdminAnalyticsPanel />,
          true
        )}
      />

      <Route
        path="/admin"
        element={
          <Navigate
            to="/statistics"
            replace
          />
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Router basename="/ege_calc">
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;