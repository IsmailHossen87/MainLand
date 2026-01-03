"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const routes_1 = __importDefault(require("./routes"));
const webhookHandler_1 = __importDefault(require("./app/modules/stripeAccount/webhookHandler"));
require("./app/config/Passport");
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const morgen_1 = require("./shared/morgen");
const app = (0, express_1.default)();
app.use(passport_1.default.initialize());
app.use((0, express_session_1.default)({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
}));
//morgan
app.use(morgen_1.Morgan.successHandler);
app.use(morgen_1.Morgan.errorHandler);
//body parser
app.use((0, cors_1.default)({
    origin: ['https://drebal-admin-dashboard.vercel.app', 'https://ismail4000.binarybards.online', 'http://localhost:3000'],
    credentials: true,
}));
app.post('/api/v1/stripe/webhook', express_1.default.raw({ type: 'application/json' }), webhookHandler_1.default);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
//file retrieve
app.use(express_1.default.static('uploads'));
//router
app.use('/api/v1', routes_1.default);
//live response
app.get('/', (req, res) => {
    const date = new Date(Date.now());
    res.send(`<h1 style="text-align:center; color:#173616; font-family:Verdana;">The Mainland server is Runing .</h1>
    <p style="text-align:center; color:#173616; font-family:Verdana;">${date}</p>
    `);
});
//global error handle
app.use(globalErrorHandler_1.default);
//handle not found route;
app.use((req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Not found',
        errorMessages: [
            {
                path: req.originalUrl,
                message: "API DOESN'T EXIST",
            },
        ],
    });
});
exports.default = app;
