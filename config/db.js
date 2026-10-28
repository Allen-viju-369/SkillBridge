const mongoose = require('mongoose');
const net = require('net');

let mongod = null;
let activeMongoUri = null;
let connectingPromise = null;

/**
 * Fast network probe to check if native local MongoDB is listening
 */
const isPortOpen = (host, port, timeout = 300) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return activeMongoUri;
  }
  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillbridge';
    const isTest = process.env.NODE_ENV === 'test';
    let shouldUseEmbedded = process.env.USE_EMBEDDED_DB_FALLBACK === 'true';

    // Check if localhost 27017 is open
    if (!isTest && (primaryUri.includes('127.0.0.1:27017') || primaryUri.includes('localhost:27017'))) {
      const isOpen = await isPortOpen('127.0.0.1', 27017, 300);
      if (isOpen) {
        try {
          await mongoose.connect(primaryUri);
          activeMongoUri = primaryUri;
          console.log(`[Database] Connected to native local MongoDB at: ${primaryUri}`);
          shouldUseEmbedded = false;
        } catch (err) {
          console.warn(`[Database] Native connection failed: ${err.message}`);
          shouldUseEmbedded = true;
        }
      } else {
        console.log('[Database] Native MongoDB service not found at port 27017.');
        shouldUseEmbedded = true;
      }
    } else if (!isTest) {
      try {
        await mongoose.connect(primaryUri);
        activeMongoUri = primaryUri;
        console.log(`[Database] Connected to external MongoDB at: ${primaryUri}`);
        shouldUseEmbedded = false;
      } catch (err) {
        console.warn(`[Database] External connection failed: ${err.message}`);
        shouldUseEmbedded = true;
      }
    } else {
      shouldUseEmbedded = true;
    }

    if (shouldUseEmbedded && mongoose.connection.readyState !== 1) {
      console.log('[Database] Activating high-performance embedded in-memory MongoDB engine...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      if (!mongod) {
        mongod = await MongoMemoryServer.create();
      }
      activeMongoUri = mongod.getUri();
      await mongoose.connect(activeMongoUri);
      console.log(`[Database] Embedded MongoDB running and connected at: ${activeMongoUri}`);
    }

    // Auto-seed on first run if database has 0 categories
    try {
      const Category = require('../models/Category');
      const categoryCount = await Category.countDocuments();
      if (categoryCount === 0) {
        console.log('[Database] Fresh database detected. Running automatic initial seeding...');
        const { runSeed } = require('../scripts/seed');
        await runSeed();
      }
    } catch (seedErr) {
      console.warn('[Database] Auto-seed check warning:', seedErr.message);
    }

    return activeMongoUri;
  })();

  try {
    const uri = await connectingPromise;
    return uri;
  } finally {
    connectingPromise = null;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
};

const getActiveUri = () => activeMongoUri;

module.exports = { connectDB, disconnectDB, getActiveUri };
