import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AcademyApplications from '../components/AcademyApplications';

/**
 * Academy Applications Page  (/academy/applications)
 * Institutional application list with search, filters, and inspector trigger.
 */
export default function AcademyApplicationsPage() {
  const {
    filteredApplications,
    allApplications,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    fetchBoardData,
    setSelectedApp,
  } = useOutletContext();

  return (
    <AcademyApplications
      filteredApplications={filteredApplications}
      allApplications={allApplications}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      fetchBoardData={fetchBoardData}
      setSelectedApp={setSelectedApp}
    />
  );
}
