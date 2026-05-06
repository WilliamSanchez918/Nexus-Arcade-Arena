import http from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config.js';
import { connectDb } from './db.js';
import { assertRuntimeSecurity } from './securityStartup.js';

const httpServer = http.createServer();
const io = new SocketServer(httpServer, {
  cors: { origin: '*' }
});
const app = createApp({ io });

io.on('connection', (socket) => {
  socket.on('cabinet:join', ({ cabinetId }) => {
    if (cabinetId) {
      socket.join(`cabinet:${cabinetId}`);
    }
  });
});

httpServer.on('request', app);

assertRuntimeSecurity();
await connectDb();

httpServer.listen(config.port, () => {
  console.log(`Nexus Arcade API listening on http://localhost:${config.port}`);
});
