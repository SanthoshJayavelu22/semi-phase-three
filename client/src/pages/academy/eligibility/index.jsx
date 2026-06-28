import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AcademyEligibility from '../components/AcademyEligibility';

/**
 * Academy Exam Eligibility Page (/academy/eligibility)
 * Overview of exam applications requested by institutes.
 * Allows Academy to approve or reject exam requests.
 */
export default function AcademyEligibilityPage() {
  const { 
    examApplications, 
    fetchBoardData,
    setErrorMsg,
    setSuccessMsg 
  } = useOutletContext();

  return (
    <AcademyEligibility
      examApplications={examApplications}
      fetchBoardData={fetchBoardData}
      setErrorMsg={setErrorMsg}
      setSuccessMsg={setSuccessMsg}
    />
  );
}
