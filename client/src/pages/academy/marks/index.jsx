import AcademyMarksUpdating from '../components/AcademyMarksUpdating';

/**
 * Academy Marks Updating Page  (/academy/marks)
 * Allows board members to enter and update student marks.
 * Subjects are fetched from the API based on the student's course.
 * Supports ABSENT marking for students who didn't appear.
 */
export default function AcademyMarksUpdatingPage() {
  return <AcademyMarksUpdating />;
}
