import './instrument.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './lib/env.js';

const app = Fastify({ logger: true });

await app.register(cors);

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
