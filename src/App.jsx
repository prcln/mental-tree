import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext/LanguageContext';
import PositionFinder from '../components/PosFinder/PosFinder';

import ProtectedRoute from '../components/ProtectedRoute';
import AuthForm from '../components/AuthComponent/AuthComponent';
import TreePage from '../pages/TreePage/TreePage';
import SharedTreePage from '../pages/SharedTreePage/SharedTreePage';
import './App.css';
import { UserReportPage } from '../pages/UserPage/UserReportPage';
import MainLayout from '../components/Layout/MainLayout';
import CommunityGarden from '../pages/CommunityGardenPage';
import QuizConfigEditor from '../pages/QuizPage/QuizEditor';
import UserStatsPanel from '../components/AdminComponent/UserStatsPanel';
import AdminDashboard from '../components/AdminComponent/AdminDashboard';


function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          {/* Login route */}
          <Route path="/login" element={<AuthForm />} />
          
          <Route element={<MainLayout />}>
            {/* Public shared tree route - no auth required */}
            <Route path="/tree/shared/:treeId" element={<SharedTreePage />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<TreePage />} />
              <Route path="/user-stats" element={<UserStatsPanel />} />
              <Route path="/admin/analytics" element={<AdminDashboard />} />
              <Route path="/tree" element={<TreePage />} />
              <Route path="/report/:treeId" element={<UserReportPage />} />
              <Route path="/garden" element={<CommunityGarden />} />
              <Route path="/quiz-editor" element={<QuizConfigEditor />} />
              <Route path="/pos" element={<PositionFinder />} />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;