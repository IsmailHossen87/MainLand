"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = __importDefault(require("colors"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const socketHelper_1 = require("./helpers/socketHelper");
const logger_1 = require("./shared/logger");
const radisConfig_1 = require("./config/radisConfig");
//uncaught exception
process.on('uncaughtException', error => {
    logger_1.errorLogger.error('UnhandleException Detected', error);
    process.exit(1);
});
let server;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(config_1.default.database_url);
            logger_1.logger.info(colors_1.default.green('🚀 Database connected successfully'));
            //Seed Super Admin after database connection is successful
            // await seedSuperAdmin();
            //  config.ip_address as string,
            const port = typeof config_1.default.port === 'number' ? config_1.default.port : Number(config_1.default.port);
            server = app_1.default.listen(port, () => {
                logger_1.logger.info(colors_1.default.yellow(`♻️  Application listening on port:${config_1.default.port}`));
            });
            //socket
            const io = new socket_io_1.Server(server, {
                pingTimeout: 60000,
                cors: {
                    origin: '*',
                },
            });
            socketHelper_1.socketHelper.socket(io);
            //@ts-ignore
            global.io = io;
        }
        catch (error) {
            logger_1.errorLogger.error(colors_1.default.red('🤢 Failed to connect Database'), error);
        }
        //handle unhandleRejection
        process.on('unhandledRejection', error => {
            if (server) {
                server.close(() => {
                    logger_1.errorLogger.error('UnhandleRejection Detected', error);
                    process.exit(1);
                });
            }
            else {
                process.exit(1);
            }
        });
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, radisConfig_1.connectRedis)();
    yield main();
}))();
//SIGTERM
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM IS RECEIVE');
    if (server) {
        server.close();
    }
});
