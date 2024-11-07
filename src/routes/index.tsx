import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Companies from '../pages/Companies';
import XmlsDownloaded from '../pages/XmlsDownloaded';
import Profile from '../pages/Profile';
import PrivateRoute from '../components/PrivateRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/companies" element={<PrivateRoute><Companies /></PrivateRoute>} />
      <Route path="/xmls" element={<PrivateRoute><XmlsDownloaded /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
    </Routes>
  );
}