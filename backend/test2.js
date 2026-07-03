const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/semidb').then(async () => {
  const db = mongoose.connection;
  const s = await db.collection('students').findOne({});
  console.log(JSON.stringify(s.semesters, null, 2));
  process.exit(0);
}).catch(console.error);
