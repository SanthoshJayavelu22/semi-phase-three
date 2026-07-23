import AcademyMarksUpdating from '../components/AcademyMarksUpdating';

/**
 * Academy Marks Updating Page  (/academy/marks)
 * Allows board members to enter and update student marks.
 */
export default function AcademyMarksUpdatingPage() {
  // The component is self-contained and doesn't need context from parent
  // but we keep the pattern consistent
  return <AcademyMarksUpdating />;
}