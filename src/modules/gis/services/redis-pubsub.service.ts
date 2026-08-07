import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private publisherClient: Redis | null = null;
  private subscriberClient: Redis | null = null;
  private messageListeners: ((channel: string, message: string) => void)[] = [];

  onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT || 6379);

    try {
      this.publisherClient = new Redis({ host, port, lazyConnect: true });
      this.subscriberClient = new Redis({ host, port, lazyConnect: true });

      this.publisherClient.connect().catch((err) => {
        this.logger.warn(`Redis Publisher Connection Warning: ${err.message}`);
      });

      this.subscriberClient.connect().catch((err) => {
        this.logger.warn(`Redis Subscriber Connection Warning: ${err.message}`);
      });

      this.subscriberClient.on('message', (channel, message) => {
        for (const listener of this.messageListeners) {
          listener(channel, message);
        }
      });

      this.logger.log(`Initialized Redis PubSub Service on ${host}:${port}`);
    } catch (err: any) {
      this.logger.error(`Failed to initialize Redis clients: ${err.message}`);
    }
  }

  async publish(channel: string, payload: any) {
    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);

    if (this.publisherClient && this.publisherClient.status === 'ready') {
      await this.publisherClient.publish(channel, message);
    }
  }

  async subscribe(channel: string, callback: (channel: string, message: string) => void) {
    this.messageListeners.push(callback);
    if (this.subscriberClient && this.subscriberClient.status === 'ready') {
      await this.subscriberClient.subscribe(channel);
    }
  }

  onModuleDestroy() {
    if (this.publisherClient) this.publisherClient.disconnect();
    if (this.subscriberClient) this.subscriberClient.disconnect();
  }
}
