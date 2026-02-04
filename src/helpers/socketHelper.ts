import colors from 'colors';
import { Server } from 'socket.io';
import { logger } from '../shared/logger';

let ioInstance: Server;

const socket = (io: Server) => {
  ioInstance = io;

  io.on('connection', socket => {
    logger.info(colors.blue('A user connected'));

    socket.on('disconnect', () => {
      logger.info(colors.red('A user disconnected'));
    });
  });
};

// 🔥 emit helper
const emit = (title: string, data: any) => {
  if (!ioInstance) {
    logger.error('Socket.io not initialized');
    return;
  }
  ioInstance.emit(title, data);
};

export const socketHelper = {
  socket,
  emit,
};
