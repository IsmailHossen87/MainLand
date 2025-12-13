"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationValidation = exports.FullNotificationZodSchema = exports.DraftNotificationZodSchema = void 0;
const zod_1 = require("zod");
// 🌱 Draft Notification Schema (all optional except isDraft)
exports.DraftNotificationZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string(),
        isDraft: zod_1.z.boolean().optional(),
        DeliveryMethod: zod_1.z.enum(['email', 'notification']).optional(),
        recipientType: zod_1.z.enum(['Active', 'Closed', 'Winner Announced']).optional(),
        message: zod_1.z.string().optional(),
    }),
});
// 🌟 Full Notification Schema (required fields)
exports.FullNotificationZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({ required_error: 'Title is required' }),
        isDraft: zod_1.z.boolean().optional(),
        DeliveryMethod: zod_1.z.enum(['email', 'notification']),
        recipientType: zod_1.z.enum(['Active', 'Closed', 'Winner Announced']),
        message: zod_1.z.string({ required_error: 'Message is required' }),
    }),
});
// ✅ Export together
exports.NotificationValidation = {
    DraftNotificationZodSchema: exports.DraftNotificationZodSchema,
    FullNotificationZodSchema: exports.FullNotificationZodSchema,
};
