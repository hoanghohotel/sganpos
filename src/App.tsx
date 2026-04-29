import { IonApp } from '@ionic/react';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import AppLayout from './layouts/AppLayout';

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <IonApp>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </IonApp>
  );
}
