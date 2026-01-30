import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import Dashboard from './Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          !token ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />
        } />
        <Route path="/register" element={
          !token ? <RegisterPage /> : <Navigate to="/" />
        } />
        <Route path="/" element={
          token ? <Dashboard token={token} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
