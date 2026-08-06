import { Server as HttpServer } from 'http';

let ioInstance: any = null;

export const initSocket = (server: HttpServer) => {
  try {
    const { Server } = require('socket.io');
    ioInstance = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    ioInstance.on('connection', (socket: any) => {
      socket.on('disconnect', () => {
        // Socket disconnected
      });
    });

    console.log('Socket.io server initialized successfully');
    return ioInstance;
  } catch (error: any) {
    console.error('Failed to initialize Socket.io:', error.message);
    return null;
  }
};

export const getIO = () => ioInstance;

export const emitEvent = (eventName: string, payload?: any) => {
  if (ioInstance) {
    try {
      ioInstance.emit(eventName, payload || {});
    } catch (err: any) {
      console.error(`Error emitting socket event ${eventName}:`, err.message);
    }
  }
};
