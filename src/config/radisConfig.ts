import { createClient } from 'redis';
import config from "./../../src/config";

// Redis client configuration
export const redisClient = createClient({
  username: config.REDIS_USERNAME,
  password: config.REDIS_PASSWORD,
  socket: {
    host: config.REDIS_HOST,
    port: Number(config.REDIS_PORT),
  },
});

// Error handling for Redis client
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err); 
});


export const connectRedis = async () => {
  try {

    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("Redis connected successfully!");
    }
  } catch (err) {
    console.error('Error connecting to Redis:', err);
  }
};

export const closeRedisConnection = async () => {
  try {
    await redisClient.quit();
    console.log("Redis connection closed.");
  } catch (err) {
    console.error('Error closing Redis connection:', err);
  }
};
