"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventValidation = exports.IValidateDate = exports.TicketTypeEnum = void 0;
const zod_1 = require("zod");
const Event_interface_1 = require("./Event.interface");
// 🎫 Enum for Ticket Type
exports.TicketTypeEnum = zod_1.z.enum(Object.values(Event_interface_1.TicketType));
exports.IValidateDate = zod_1.z
    .union([
    zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Must be a valid date string"
    }),
    zod_1.z.number().refine((val) => val > 0 && !isNaN(new Date(val).getTime()), {
        message: "Must be a valid timestamp"
    }),
])
    .transform((val) => {
    return new Date(val);
});
// 🧾 Ticket Schema
const TicketSchema = zod_1.z.object({
    type: exports.TicketTypeEnum,
    price: zod_1.z.number().min(0, "Price must be positive"),
    availableUnits: zod_1.z.number().int().min(1, "At least 1 ticket required"),
});
// 💸 Discount Code Schema
// 💸 Simple Discount Code Schema
const DiscountCodeSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Code is required"),
    percentage: zod_1.z.number().min(0).max(100),
    expireDate: zod_1.z.union([
        zod_1.z.string().transform((val) => new Date(val)),
        zod_1.z.number().transform((val) => new Date(val)),
        zod_1.z.date(),
    ]).refine((date) => !isNaN(date.getTime()), {
        message: "Invalid date provided for expireDate"
    }),
});
// 👤 Organizer Schema
const OrganizerSchema = zod_1.z.object({
    organizerName: zod_1.z.string().trim().optional(),
    organizerEmail: zod_1.z
        .string()
        .email({ message: "Invalid email" })
        .or(zod_1.z.literal("").transform(() => ""))
        .nullable()
        .optional(),
    organizerPhone: zod_1.z.string().trim().optional(),
});
// 🏷️ Category Schema
const CategorySchema = zod_1.z.object({
    categoryId: zod_1.z
        .string()
        .length(24, "Invalid CategoryId length"),
    subCategory: zod_1.z
        .array(zod_1.z.string().length(24, "Invalid SubCategoryId length"))
        .default([]),
});
// 📅 Valid Date String
// 🌱 Draft Event Schema (optional, nullable allowed)
const DraftEventZodSchema = zod_1.z.object({
    body: zod_1.z.object(Object.assign(Object.assign({ eventName: zod_1.z.string().trim().optional(), title: zod_1.z.string().trim().optional(), category: zod_1.z.array(CategorySchema).nullable().optional(), tags: zod_1.z.array(zod_1.z.string().trim()).nullable().optional(), eventDate: exports.IValidateDate.nullable().optional(), startTime: zod_1.z.string().nullable().optional(), notification: zod_1.z.string().optional(), endTime: zod_1.z.string().nullable().optional(), streetAddress: zod_1.z.string().nullable().optional(), streetAddress2: zod_1.z.string().nullable().optional(), isFreeEvent: zod_1.z.boolean().optional(), city: zod_1.z.string().nullable().optional(), state: zod_1.z.string().nullable().optional(), country: zod_1.z.string().nullable().optional(), tickets: zod_1.z.array(TicketSchema).nullable().optional(), ticketSaleStart: exports.IValidateDate.nullable().optional(), preSaleStart: exports.IValidateDate.nullable().optional(), preSaleEnd: exports.IValidateDate.nullable().optional(), discountCodes: zod_1.z.array(DiscountCodeSchema).nullable().optional() }, OrganizerSchema.shape), { description: zod_1.z.string().nullable().optional(), isDraft: zod_1.z.boolean().optional() })),
});
// ✅ Full Event Schema (required fields)
const FullEventZodSchema = zod_1.z.object({
    body: zod_1.z.object(Object.assign(Object.assign({ eventName: zod_1.z.string({ required_error: "Event name is required" }).trim(), image: zod_1.z.string({ required_error: "Image is required" }).optional(), category: zod_1.z
            .array(zod_1.z.object({
            categoryId: zod_1.z.string().length(24, "Invalid CategoryId length"),
            subCategory: zod_1.z.array(zod_1.z.string().length(24, "Invalid SubCategoryId length")),
        }))
            .min(1, "At least one category is required"), tags: zod_1.z.array(zod_1.z.string().trim()).optional(), eventDate: exports.IValidateDate, startTime: zod_1.z.string(), endTime: zod_1.z.string(), notification: zod_1.z.string().optional(), streetAddress: zod_1.z.string({ required_error: "Address is required" }).trim(), streetAddress2: zod_1.z.string().optional(), city: zod_1.z.string({ required_error: "City is required" }).trim(), state: zod_1.z.string({ required_error: "State is required" }).trim(), country: zod_1.z.string({ required_error: "Country is required" }).trim(), isFreeEvent: zod_1.z.boolean().optional(), tickets: zod_1.z.array(TicketSchema).min(1, "At least one ticket type is required"), ticketSaleStart: exports.IValidateDate.optional(), preSaleStart: exports.IValidateDate.optional(), preSaleEnd: exports.IValidateDate.optional(), discountCodes: zod_1.z.array(DiscountCodeSchema).optional() }, OrganizerSchema.shape), { description: zod_1.z.string({ required_error: "Description is required" }).trim(), isDraft: zod_1.z.boolean().optional() })),
});
exports.EventValidation = {
    DraftEventZodSchema,
    FullEventZodSchema,
};
