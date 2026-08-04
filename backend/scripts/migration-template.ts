import mongoose from 'mongoose';

export const up = async (): Promise<void> => {
  // Add new fields, collections, or indexes
  await mongoose.connection.collection('students').updateMany(
    {},
    { $set: { newField: 'default' } }
  );
  console.log('Migration up completed');
};

export const down = async (): Promise<void> => {
  // Rollback changes
  await mongoose.connection.collection('students').updateMany(
    {},
    { $unset: { newField: '' } }
  );
  console.log('Migration down completed');
};
