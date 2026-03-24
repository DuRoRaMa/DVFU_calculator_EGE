import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Header from './components/Layout/Header';
import ProgramSelector from './components/Program/ProgramSelector';
import CalculatorPage from './pages/CalculatorPage';
import ScenarioPage from './pages/ScenarioPage';
import { getPrograms } from './services/api';
import Loader from './components/Common/Loader';
import ErrorAlert from './components/Common/ErrorAlert';
import Login from './components/Auth/Login';

// Тема в стиле ДВФУ (синие цвета)
const theme = createTheme({
  palette: {
    primary: {
      main: '#003366', // Темно-синий ДВФУ
    },
    secondary: {
      main: '#ff9900', // Оранжевый акцент
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('accessToken') || null);


  // Загружаем список программ при старте
  useEffect(() => {
    if (!token) return;
    const loadPrograms = async () => {
      try {
        setLoading(true);
        const response = await getPrograms({ token });
        setPrograms(response.data);
      } catch (err) {
        setError('Ошибка загрузки программ');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadPrograms();
  }, [token]);

  const handleSelectProgram = (program) => {
    setSelectedProgram(program);
    setError(null);
  };

  // Функция logout
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setSelectedProgram(null);
  };

  if (!token) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login setToken={setToken} />
      </ThemeProvider>
    );
  }

  if (loading) {
    return <Loader message="Загрузка программ..." />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header onLogout={handleLogout}/>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <ErrorAlert error={error} onClose={() => setError(null)} />
          
          <Routes>
            <Route path="/" element={
              <ProgramSelector 
                programs={programs}
                selectedProgram={selectedProgram}
                onSelectProgram={handleSelectProgram}
              />
            } />
            
            <Route path="/calculate/:programId" element={
              selectedProgram ? (
                <CalculatorPage 
                  program={selectedProgram}
                  onError={setError}
                />
              ) : (
                <Navigate to="/" />
              )
            } />
            
            <Route path="/scenario/:programId" element={
              selectedProgram ? (
                <ScenarioPage 
                  program={selectedProgram}
                  onError={setError}
                />
              ) : (
                <Navigate to="/" />
              )
            } />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;