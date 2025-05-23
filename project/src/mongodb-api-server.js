// mongodb-api-server.js - Simple REST API for MongoDB
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = 3001; // Different port from your React app
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'currypointNew';

// Middleware
app.use(cors());
app.use(express.json());

let db;

// Connect to MongoDB
MongoClient.connect(MONGO_URI)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(DB_NAME);
  })
  .catch(error => console.error('MongoDB connection error:', error));

// Health check endpoint
app.get('/currypointNew/ping', (req, res) => {
  res.json({ status: 'OK', message: 'MongoDB API is running' });
});

// Generic GET endpoint for collections
app.get('/currypointNew/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const data = await db.collection(collection).find({}).toArray();
    res.json(data);
  } catch (error) {
    console.error(`Error fetching ${req.params.collection}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Generic POST endpoint to save data to collections
app.post('/currypointNew/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const data = req.body;
    
    // Clear existing data and insert new data
    await db.collection(collection).deleteMany({});
    
    if (Array.isArray(data) && data.length > 0) {
      const result = await db.collection(collection).insertMany(data);
      res.json({ success: true, insertedCount: result.insertedCount });
    } else if (!Array.isArray(data)) {
      const result = await db.collection(collection).insertOne(data);
      res.json({ success: true, insertedId: result.insertedId });
    } else {
      res.json({ success: true, message: 'No data to insert' });
    }
  } catch (error) {
    console.error(`Error saving to ${req.params.collection}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Generic PUT endpoint to update single document
app.put('/currypointNew/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const data = req.body;
    
    const result = await db.collection(collection).replaceOne(
      { id: parseInt(id) }, 
      data, 
      { upsert: true }
    );
    
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error(`Error updating ${req.params.collection}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Generic DELETE endpoint
app.delete('/currypointNew/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    
    const result = await db.collection(collection).deleteOne({ id: parseInt(id) });
    
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error(`Error deleting from ${req.params.collection}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`MongoDB REST API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/currypointNew/ping`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down MongoDB REST API server...');
  process.exit(0);
});