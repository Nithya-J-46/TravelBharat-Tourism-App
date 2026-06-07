require('dotenv').config();
const mongoose = require('mongoose');

const fixIndexes = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelbharat';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: 'users' }).toArray();
    
    if (collections.length > 0) {
      const indexes = await db.collection('users').indexes();
      console.log('Current indexes on users collection:', indexes.map(idx => idx.name));
      
      const hasUsernameIndex = indexes.some(idx => idx.name === 'username_1');
      if (hasUsernameIndex) {
        await db.collection('users').dropIndex('username_1');
        console.log('Successfully dropped old "username_1" unique index.');
      } else {
        console.log('"username_1" index did not exist.');
      }
    } else {
      console.log('Users collection does not exist yet.');
    }

    console.log('Index fix completed successfully.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error fixing indexes:', error);
    if (mongoose.connection) mongoose.connection.close();
  }
};

fixIndexes();
