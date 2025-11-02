import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import AuthForm from '../components/AuthComponent/AuthComponent';
import TreePage from '../pages/TreePage/TreePage';
import SharedTreePage from '../pages/SharedTreePage/SharedTreePage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Login route */}
        <Route path="/login" element={<AuthForm />} />
        
        {/* Public shared tree route - no auth required */}
        <Route path="/tree/shared/:treeId" element={<SharedTreePage />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<TreePage />} />
          <Route path="/tree" element={<TreePage />} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;