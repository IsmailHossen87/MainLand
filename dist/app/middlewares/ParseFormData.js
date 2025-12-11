"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFormDataMiddleware = void 0;
const parseFormDataMiddleware = (req, res, next) => {
    var _a, _b, _c;
    try {
        if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.data) {
            console.log('No parsed Data', (_b = req === null || req === void 0 ? void 0 : req.body) === null || _b === void 0 ? void 0 : _b.data);
            const parsed = JSON.parse(req.body.data);
            console.log('Parsed data:', parsed);
            req.body = Object.assign({}, parsed);
        }
        next();
    }
    catch (error) {
        console.error('JSON Parse Error:', error);
        console.error('Received data:', (_c = req.body) === null || _c === void 0 ? void 0 : _c.data);
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON format in form-data "data" field',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.parseFormDataMiddleware = parseFormDataMiddleware;
