import { useLocation } from 'react-router-dom';
import MainMenu from './MainMenu';
import { useIdleTimer } from '../hooks/useIdleTimer';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  // Always use the hook, but conditionally enable/disable its functionality
  useIdleTimer();

  return (
    <div className="min-h-screen bg-gray-100">
      {!isAuthPage && <MainMenu />}
      <main>{children}</main>
    </div>
  );
}