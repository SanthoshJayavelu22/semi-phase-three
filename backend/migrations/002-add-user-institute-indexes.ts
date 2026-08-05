import mongoose from 'mongoose';

export const up = async (): Promise<void> => {
  // Add audit indexes to academic_records and users collections for query performance
  await mongoose.connection.collection('users').createIndex({ email: 1, role: 1 });
  await mongoose.connection.collection('institutes').createIndex({ status: 1 });
  console.log('Migration up completed: Created indexes on users and institutes collections');
};

export const down = async (): Promise<void> => {
  try {
    await mongoose.connection.collection('users').dropIndex('email_1_role_1');
    await mongoose.connection.collection('institutes').dropIndex('status_1');
  } catch (err) {
    console.warn('Migration down warning:', err);
  }
  console.log('Migration down completed');
};
