require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const crmRoutes = require('./routes/crm');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/crm', crmRoutes);

// GET /api/seed (No Auth)
app.get('/api/seed', async (req, res) => {
  try {
    const seedLeads = require('./scripts/seedLeads');
    await seedLeads();
    res.json({ message: "Demo loaded" });
  } catch (err) {
    res.status(500).json({ message: 'Server error during seed', error: err.message });
  }
});

// GET /api/seed-excel (No Auth)
app.get('/api/seed-excel', async (req, res) => {
  try {
    const seedFromExcel = require('./scripts/seedFromExcel');
    const count = await seedFromExcel();
    res.json({ message: `Successfully loaded ${count} leads from Excel dataset` });
  } catch (err) {
    res.status(500).json({ message: 'Server error during excel seed', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

async function resolveMongoUri() {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leadcrm';
  if (process.env.USE_MEMORY_MONGO === 'true') {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log('Using in-memory MongoDB (USE_MEMORY_MONGO=true)');
  }
  return uri;
}

async function start() {
  const mongoUri = await resolveMongoUri();
  const connectOpts =
    process.env.USE_MEMORY_MONGO === 'true' ? { dbName: 'leadcrm' } : {};
  await mongoose.connect(mongoUri, connectOpts);
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
