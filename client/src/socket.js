import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5003';
    }
    return window.location.origin;
  }
  return 'http://localhost:5003';
};

export const socket = io(getSocketUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});

export default socket;
