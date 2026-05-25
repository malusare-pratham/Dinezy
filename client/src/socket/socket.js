import { io } from 'socket.io-client';

let socket = null;

const getBaseUrl = () => {
  const raw =
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000';

  const normalized =
    String(raw || '').replace(/\/+$/,'');

  if(normalized.toLowerCase().endsWith('/api')){
    return normalized.slice(0,-4);
  }

  return normalized;
};

export const getSocket = () => {
  if(socket) return socket;

  socket = io(getBaseUrl(), {
    transports:['websocket','polling'],
    autoConnect:true
  });

  return socket;
};

export const disconnectSocket = () => {
  if(!socket) return;
  try{
    socket.disconnect();
  }
  finally{
    socket = null;
  }
};

