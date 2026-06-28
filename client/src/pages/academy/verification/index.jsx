import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AcademyVerification from '../components/AcademyVerification';

/**
 * Academy Eligibility Verification Page  (/academy/verification)
 * Allows board members to approve or reject student exam eligibility.
 */
export default function AcademyVerificationPage() {
  const {
    students,
    selectedStudentId, setSelectedStudentId,
    handleVerifyStudentEligibility,
  } = useOutletContext();

  return (
    <AcademyVerification
      students={students}
      selectedStudentId={selectedStudentId}
      setSelectedStudentId={setSelectedStudentId}
      onVerifyStudent={handleVerifyStudentEligibility}
    />
  );
}
