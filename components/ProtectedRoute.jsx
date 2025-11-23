import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext/useAuth.js';
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 via-pink-50 to-green-100">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌳</div>
          <p className="text-gray-600">Loading your mood tree...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet replace/>;
};

export default ProtectedRoute;