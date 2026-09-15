import { useOutletContext } from 'react-router-dom';
import AcademyThesisVerification from '../components/AcademyThesisVerification';

/**
 * Academy Thesis, Documents & Attendance Verification Page (/academy/academic-verification)
 * Allows the Academic Department to review and verify each student's thesis submission,
 * uploaded documents, and attendance before certifying them eligible for board examinations.
 */
export default function AcademyAcademicVerificationPage() {
  const {
    students = [],
    fetchBoardData,
    setErrorMsg,
    setSuccessMsg,
  } = useOutletContext() || {};

  return (
    <AcademyThesisVerification
      students={students}
      fetchBoardData={fetchBoardData}
      setErrorMsg={setErrorMsg}
      setSuccessMsg={setSuccessMsg}
    />
  );
}