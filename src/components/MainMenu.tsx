import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, BuildingOfficeIcon, UserCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function MainMenu() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">NF HUB</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`${
                  isActive('/') 
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <HomeIcon className="h-5 w-5 mr-1" />
                Dashboard
              </Link>

              <Link
                to="/companies"
                className={`${
                  isActive('/companies')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <BuildingOfficeIcon className="h-5 w-5 mr-1" />
                Empresas
              </Link>

              <Link
                to="/xmls"
                className={`${
                  isActive('/xmls')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                <DocumentTextIcon className="h-5 w-5 mr-1" />
                XMLs Baixados
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className={`${
                isActive('/profile')
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              } inline-flex items-center space-x-1`}
            >
              <UserCircleIcon className="h-6 w-6" />
              <span>{currentUser?.get('username')}</span>
            </Link>
            <button
              onClick={() => logout()}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}