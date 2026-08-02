import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { redis } from './config/redis.js';
import { startTaskWorker } from './workers/task.worker.js';
import { verifyAccessToken } from './utils/tokens.js';
const server = createServer(app);
export const io = new Server(server, { cors: { origin: env.CLIENT_ORIGIN.split(','), credentials: true } });
io.use((socket, next) => { try { socket.data.user = verifyAccessToken(socket.handshake.auth.token); next(); } catch { next(new Error('Unauthorized socket connection')); } });
io.on('connection', (socket) => socket.join(`user:${socket.data.user.sub}`));
async function start() { await connectDatabase(); await redis.ping(); startTaskWorker(io); server.listen(env.PORT, () => console.log(`API listening on :${env.PORT}`)); }
start().catch((error) => { console.error('Startup failed', error); process.exit(1); });
