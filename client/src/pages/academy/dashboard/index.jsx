import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import AcademyDashboard from '../components/AcademyDashboard';

/**
 * Academy Dashboard Page  (/academy/dashboard)
 * Shows overview metrics cards and quick-navigation links.
 */
export default function AcademyDashboardPage() {
  const navigate = useNavigate();
  const { dynamicMetrics } = useOutletContext();

  const setActiveTab = tab => {
    const routes = {
      dashboard: '/academy/dashboard',
      applications: '/academy/applications',
      students: '/academy/students',
      eligibility: '/academy/eligibility',
      verification: '/academy/verification',
      marks: '/academy/marks',
      'student-marks': '/academy/student-marks',
      'publish-results': '/academy/publish-results',
      'publish-details': '/academy/publish-details',
      revaluation: '/academy/revaluation',
    };
    navigate(routes[tab] || '/academy/dashboard');
  };

  return <AcademyDashboard dynamicMetrics={dynamicMetrics} setActiveTab={setActiveTab} />;
}
