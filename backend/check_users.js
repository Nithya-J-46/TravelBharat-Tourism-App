const mongoose = require('mongoose');
const User = require('./models/User');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/travelbharat');
  const users = await User.find({});
  console.log(`Total users in DB: ${users.length}`);
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}), role: ${u.role}`);
  });
  mongoose.connection.close();
}

check();
