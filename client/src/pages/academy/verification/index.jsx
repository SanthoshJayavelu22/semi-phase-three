import { useOutletContext } from 'react-router-dom';
import AcademyStudentVerification from '../components/AcademyStudentVerification';

/**
 * Academy Student Enrollment Verification Page (/academy/verification)
 * Allows Academic Department to audit and approve, reject, or request correction for student enrollments.
 */
export default function AcademyVerificationPage() {
  const {
    students = [],
    fetchBoardData,
    setErrorMsg,
    setSuccessMsg,
  } = useOutletContext() || {};

  return (
    <AcademyStudentVerification
      students={students}
      fetchBoardData={fetchBoardData}
      setErrorMsg={setErrorMsg}
      setSuccessMsg={setSuccessMsg}
    />
  );
}

