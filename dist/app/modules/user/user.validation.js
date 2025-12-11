"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
const zod_1 = require("zod");
const user_1 = require("../../../enums/user");
const Event_Validation_1 = require("../ORGANIZER/Event/Event.Validation");
const createUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }).optional(),
        email: zod_1.z.string().email({ message: 'Invalid email format' }),
        password: zod_1.z
            .string()
            .min(8, { message: 'Password must be at least 8 characters long' }),
        bio: zod_1.z.string().optional(),
        image: zod_1.z.string().url().optional(),
    }),
});
const updateUserZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        role: zod_1.z.nativeEnum(user_1.USER_ROLES).optional(),
        email: zod_1.z.string().email().optional(),
        password: zod_1.z.string().min(8).optional(),
        bio: zod_1.z.string().optional(),
        image: zod_1.z.string().url().optional(),
        personalInfo: zod_1.z
            .object({
            firstName: zod_1.z.string().optional(),
            lastName: zod_1.z.string().optional(),
            phone: zod_1.z.string().optional(),
            bio: zod_1.z.string().optional(),
            // ✨ NEW: Date of Birth validation
            dateOfBirth: Event_Validation_1.IValidateDate.nullable().optional(),
        })
            .optional(),
        address: zod_1.z
            .object({
            country: zod_1.z.string().optional(),
            city: zod_1.z.string().optional(),
            postalCode: zod_1.z.string().optional(),
            street: zod_1.z.string().optional(),
        })
            .optional(),
        // ✨ NEW: Notification validation
        notification: zod_1.z
            .object({
            isSellTicketNotificationEnabled: zod_1.z.boolean().optional(),
            isMessageNotificationEnabled: zod_1.z.boolean().optional(),
            isPublishEventNotificationEnabled: zod_1.z.boolean().optional(),
            isWithdrawMoneyNotificationEnabled: zod_1.z.boolean().optional(),
        })
            .optional(),
    }),
});
exports.UserValidation = {
    createUserZodSchema, updateUserZodSchema
};
