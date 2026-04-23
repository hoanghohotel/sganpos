import { Server } from 'socket.io';

let io: Server | null = null;

export const initSocket = (socketServer: Server) => {
  io = socketServer;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Utility to emit an event to a specific tenant's room
 */
export const emitToTenant = (tenantId: string, event: string, data: any) => {
  if (io) {
    console.log(`[Socket] Emitting ${event} to tenant: ${tenantId}`);
    io.to(tenantId).emit(event, data);
  }
};
