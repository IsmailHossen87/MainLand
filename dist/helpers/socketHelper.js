"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketHelper = void 0;
const colors_1 = __importDefault(require("colors"));
const logger_1 = require("../shared/logger");
let ioInstance;
const socket = (io) => {
    ioInstance = io;
    io.on('connection', socket => {
        logger_1.logger.info(colors_1.default.blue('A user connected'));
        socket.on('disconnect', () => {
            logger_1.logger.info(colors_1.default.red('A user disconnected'));
        });
    });
};
// 🔥 emit helper
const emit = (title, data) => {
    if (!ioInstance) {
        logger_1.logger.error('Socket.io not initialized');
        return;
    }
    ioInstance.emit(title, data);
};
exports.socketHelper = {
    socket,
    emit,
};
