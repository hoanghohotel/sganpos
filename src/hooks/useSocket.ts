import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (onEvent?: (event: string, data: any) => void) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the same host
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to server');
    });

    // Listen for generic tenant events
    socket.on('order:new', (data) => {
      onEvent?.('order:new', data);
    });

    socket.on('order:update', (data) => {
      onEvent?.('order:update', data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef.current;
};
