import { createClient, RedisClientType } from 'redis';

export class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: 'redis://localhost:6379',
    });

    this.client.on('error', err => {
      console.error('Redis error:', err);
    });
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async get(key: string) {
    await this.connect();
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await this.connect();
    await this.client.set(key, value, {
      EX: ttlSeconds,
    });
  }
}

//temporary adding these lines

