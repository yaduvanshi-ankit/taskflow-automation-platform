import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-characters-long';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://:testpass@127.0.0.1:6380';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';

let stopMemoryServer: (() => Promise<void>) | undefined;

beforeAll(async () => {
  if (process.env.TEST_MONGO_URI) {
    // CI (and any environment with a reachable Mongo instance) connects directly —
    // this avoids downloading the mongodb-memory-server binary from the network.
    process.env.MONGODB_URI = process.env.TEST_MONGO_URI;
  } else {
    // Local development convenience: spin up an ephemeral in-memory MongoDB.
    // Requires outbound network access to fetch the mongod binary on first run.
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    stopMemoryServer = async () => {
      await mongo.stop();
    };
  }
  await mongoose.connect(process.env.MONGODB_URI);
}, 60000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await stopMemoryServer?.();
});
