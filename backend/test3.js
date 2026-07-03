const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/semi').then(async () => {
  const db = mongoose.connection;
  const s = await db.collection('students').find({}).toArray();
  console.log('Students count:', s.length);
  if (s.length > 0) {
    console.log(JSON.stringify(s[0].semesters, null, 2));
  }
  process.exit(0);
}).catch(console.error);
