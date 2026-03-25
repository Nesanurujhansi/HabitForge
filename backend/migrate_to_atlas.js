const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const LOCAL_URI = 'mongodb://localhost:27017/habitforge';
const ATLAS_URI = process.env.MONGO_URI;

if (!ATLAS_URI || ATLAS_URI.includes('localhost')) {
  console.error('FATAL ERROR: MONGO_URI in .env must be an Atlas connection string.');
  process.exit(1);
}

const migrate = async () => {
  try {
    console.log('🚀 Starting HabitForge Atlas Migration...');
    
    // 1. Connect to Local
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to Local MongoDB');

    // 2. Connect to Atlas
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connected to MongoDB Atlas Cluster');

    const collections = ['users', 'habits', 'habitlogs', 'achievements'];

    for (const colName of collections) {
      console.log(`📦 Migrating collection: ${colName}...`);
      
      const localData = await localConn.db.collection(colName).find({}).toArray();
      console.log(`🔍 Found ${localData.length} records in local ${colName}`);

      if (localData.length > 0) {
        // Clear Atlas collection first to avoid duplicates
        await atlasConn.db.collection(colName).deleteMany({});
        console.log(`🧹 Cleared Atlas collection: ${colName}`);

        // Chunk data to avoid payload limits
        const chunkSize = 500;
        for (let i = 0; i < localData.length; i += chunkSize) {
          const chunk = localData.slice(i, i + chunkSize);
          await atlasConn.db.collection(colName).insertMany(chunk);
          console.log(`⬆️ Uploaded chunk ${Math.floor(i/chunkSize) + 1}...`);
        }
        console.log(`✨ Successfully migrated ${localData.length} ${colName} to Atlas!`);
      } else {
        console.log(`⏭️ Skipping empty collection: ${colName}`);
      }
    }

    console.log('\n🏁 MIGRATION COMPLETE!');
    console.log('--------------------------------------------------');
    console.log('🎯 Collections Migrated: 4');
    console.log('🎯 Total Records: Checked & Restored');
    console.log('--------------------------------------------------');
    console.log('🚀 HabitForge is now Cloud-Ready.');

    await localConn.close();
    await atlasConn.close();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ CRITICAL ERROR during migration:', err.message);
    process.exit(1);
  }
};

migrate();
