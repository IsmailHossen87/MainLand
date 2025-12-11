"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOneToOneChatValidation = void 0;
const zod_1 = require("zod");
exports.createOneToOneChatValidation = zod_1.z.object({
    params: zod_1.z.object({
        otherUserId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    }),
});
