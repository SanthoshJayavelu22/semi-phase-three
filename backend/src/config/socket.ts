import { Server as HttpServer } from 'http';

let ioInstance: any = null;

// Track active client entity subscriptions
const clientSubscriptions = new Map<string, Set<string>>();

export const initSocket = (server: HttpServer) => {
  try {
    const socketModule = require('socket.io');
    const ServerClass = socketModule.Server || socketModule;
    ioInstance = new ServerClass(server, {
      cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
      },
      transports: ['polling', 'websocket'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    ioInstance.on('connection', (socket: any) => {
      // Client subscribes to entity types they care about
      socket.on('subscribe', (data: { entityTypes: string[] }) => {
        const { entityTypes = [] } = data || {};
        if (!clientSubscriptions.has(socket.id)) {
          clientSubscriptions.set(socket.id, new Set());
        }
        const subs = clientSubscriptions.get(socket.id)!;
        entityTypes.forEach((type) => subs.add(type));

        // Lazily fetch and return current timestamps without circular dependency
        try {
          const { cacheService } = require('../services/cacheService');
          if (cacheService && typeof cacheService.getAllTimestamps === 'function') {
            cacheService.getAllTimestamps().then((timestamps: Record<string, number>) => {
              socket.emit('timestamps', timestamps);
            }).catch(() => {});
          }
        } catch (e) {
          // Ignore cache service import error if initializing
        }
      });

      // Client unsubscribes
      socket.on('unsubscribe', (data: { entityTypes: string[] }) => {
        const subs = clientSubscriptions.get(socket.id);
        if (subs && Array.isArray(data?.entityTypes)) {
          data.entityTypes.forEach((type) => subs.delete(type));
        }
      });

      // Client requests an explicit refresh
      socket.on('refresh', (data: { entityType: string }) => {
        const { entityType } = data || {};
        if (entityType) {
          socket.emit('refresh_required', { entityType });
        }
      });

      socket.on('disconnect', () => {
        clientSubscriptions.delete(socket.id);
      });
    });

    console.log('✅ Socket.io server initialized successfully');
    return ioInstance;
  } catch (error: any) {
    console.warn('⚠️ Socket.io module (socket.io) not available in local node_modules. Falling back to HTTP sync mode.');
    ioInstance = {
      emit: () => {},
      on: () => {},
    };
    return ioInstance;
  }
};

export const getIO = () => ioInstance;

export const emitEvent = (eventName: string, payload?: any) => {
  if (ioInstance && typeof ioInstance.emit === 'function') {
    try {
      if (eventName === 'DATA_CHANGED') {
        ioInstance.emit('DATA_CHANGED', payload || {});
      } else {
        ioInstance.emit(eventName, payload || {});
      }
    } catch (err: any) {
      console.error(`Error emitting socket event ${eventName}:`, err.message);
    }
  }
};
