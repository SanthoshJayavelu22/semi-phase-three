// Socket completely removed — dummy fallback export

export const socket = {
  on: () => {},
  off: () => {},
  emit: () => {},
  connect: () => {},
  disconnect: () => {},
};

export default socket;
