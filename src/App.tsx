import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import MainLayout from './components/layout/MainLayout';

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <MainLayout />
    </Router>
  );
}
