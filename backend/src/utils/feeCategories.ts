export const getFeeCategory = (paymentPurpose: string): string => {
  const purpose = (paymentPurpose || '').toLowerCase();
  if (purpose.includes('enrollment')) return 'ENROLLMENT';
  if (purpose.includes('examination') || purpose.includes('exam')) return 'EXAM_FEE';
  if (purpose.includes('revaluation')) return 'REVALUATION';
  if (purpose.includes('remittance')) return 'REMITTANCE';
  if (purpose.includes('inspection') || purpose.includes('onboarding')) return 'ONBOARDING';
  return 'OTHER';
};

export const getFeeCategoryLabel = (category: string): string => {
  const map: Record<string, string> = {
    'ONBOARDING': 'Institute Onboarding',
    'ENROLLMENT': 'Student Enrollment',
    'EXAM_FEE': 'Exam Application Fee',
    'REVALUATION': 'Revaluation Fee',
    'REMITTANCE': 'Academy Remittance',
    'OTHER': 'Other Payment',
  };
  return map[category] || category;
};
