const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/semidb').then(async () => {
  const db = mongoose.connection;
  const students = await db.collection('students').find({}).toArray();
  const statuses = new Set();
  students.forEach(s => {
    if (s.semesters) {
      s.semesters.forEach(sem => {
        statuses.add(sem.eligibilityStatus);
      });
    }
  });
  console.log('Statuses:', Array.from(statuses));
  process.exit(0);
}).catch(console.error);
