import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AcademyStudents from '../components/AcademyStudents';

/**
 * Academy Students Registry Page  (/academy/students)
 * Shows the full student roster with search and view-dossier action.
 */
export default function AcademyStudentsPage() {
  const {
    filteredStudents,
    studentSearchQuery, setStudentSearchQuery,
    handleViewStudent,
  } = useOutletContext();

  return (
    <AcademyStudents
      filteredStudents={filteredStudents}
      studentSearchQuery={studentSearchQuery}
      setStudentSearchQuery={setStudentSearchQuery}
      handleView={handleViewStudent}
    />
  );
}
