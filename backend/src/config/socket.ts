// Socket.io disabled — clean no-op stubs

export const initSocket = (_server?: any) => {
  return null;
};

export const getIO = () => null;

export const emitEvent = (_eventName: string, _payload?: any) => {
  // No-op
};
