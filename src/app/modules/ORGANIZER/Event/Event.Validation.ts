// ==========================================
// 📄 FILE: Event.validation.ts (NULL HANDLING FIXED)
// ==========================================

import { z } from "zod";
import { TicketType } from "./Event.interface";

// 🎫 Enum for Ticket Type
export const TicketTypeEnum = z.enum(Object.values(TicketType) as [string, ...string[]]);

// 📅 Valid Date String - ✅ FIX: null value accept করবে
export const IValidateDate = z
  .union([
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Must be a valid date string"
    }),
    z.number().refine((val) => val > 0 && !isNaN(new Date(val).getTime()), {
      message: "Must be a valid timestamp"
    }),
    z.null(), // ✅ FIX: null value allow করা হয়েছে
  ])
  .transform((val) => {
    // ✅ FIX: null হলে null return করবে
    if (val === null) return null;
    return new Date(val);
  });

// 🧾 Ticket Schema
const TicketSchema = z.object({
  type: TicketTypeEnum,
  price: z.number().min(0, "Price must be positive"),
  availableUnits: z.number().int().min(1, "At least 1 ticket required"),
});

// 💸 Discount Code Schema
const DiscountCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  percentage: z.number().min(0).max(100),
  expireDate: z.union([
    z.string().transform((val) => new Date(val)),
    z.number().transform((val) => new Date(val)),
    z.date(),
  ]).refine((date) => !isNaN(date.getTime()), {
    message: "Invalid date provided for expireDate"
  }),
});

// 👤 Organizer Schema
const OrganizerSchema = z.object({
  organizerName: z.string().trim().optional(),
  organizerEmail: z
    .string()
    .email({ message: "Invalid email" })
    .or(z.literal("").transform(() => ""))
    .nullable()
    .optional(),
  organizerPhone: z.string().trim().optional(),
});

// 🏷️ Category Schema
const CategorySchema = z.object({
  categoryId: z
    .string()
    .length(24, "Invalid CategoryId length"),
  subCategory: z
    .array(z.string().length(24, "Invalid SubCategoryId length"))
    .default([]),
});

// 🌱 Draft Event Schema (optional, nullable allowed)
const DraftEventZodSchema = z.object({
  body: z.object({
    eventName: z.string().trim().optional(),
    title: z.string().trim().optional(),
    category: z.array(CategorySchema).nullable().optional(),
    tags: z.array(z.string().trim()).nullable().optional(),
    eventDate: IValidateDate.nullable().optional(),
    startTime: z.string().nullable().optional(),
    notification: z.string().optional(),
    endTime: z.string().nullable().optional(),
    streetAddress: z.string().nullable().optional(),
    streetAddress2: z.string().nullable().optional(),
    isFreeEvent: z.boolean().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    tickets: z.array(TicketSchema).nullable().optional(),
    ticketSaleStart: IValidateDate.nullable().optional(),
    preSaleStart: IValidateDate.nullable().optional(),
    preSaleEnd: IValidateDate.nullable().optional(),
    discountCodes: z.array(DiscountCodeSchema).nullable().optional(),
    ...OrganizerSchema.shape,
    description: z.string().nullable().optional(),
    isDraft: z.boolean().optional(),
  }),
});

// ✅ Full Event Schema (required fields)
const FullEventZodSchema = z.object({
  body: z.object({
    eventName: z.string({ required_error: "Event name is required" }).trim(),
    image: z.string({ required_error: "Image is required" }).optional(),
    category: z
      .array(
        z.object({
          categoryId: z.string().length(24, "Invalid CategoryId length"),
          subCategory: z.array(z.string().length(24, "Invalid SubCategoryId length")),
        })
      )
      .min(1, "At least one category is required"),
    tags: z.array(z.string().trim()).optional(),
    eventDate: IValidateDate,
    startTime: z.string(),
    endTime: z.string(),
    notification: z.string().optional(),
    streetAddress: z.string({ required_error: "Address is required" }).trim(),
    streetAddress2: z.string().optional(),
    city: z.string({ required_error: "City is required" }).trim(),
    state: z.string({ required_error: "State is required" }).trim(),
    country: z.string({ required_error: "Country is required" }).trim(),
    isFreeEvent: z.boolean().optional(),

    // ✅ FIX: tickets optional
    tickets: z.array(TicketSchema).optional(),

    // ✅ FIX: এই fields nullable এবং optional করা হয়েছে
    // কারণ free event এ এগুলো লাগবে না
    ticketSaleStart: IValidateDate.nullable().optional(),
    preSaleStart: IValidateDate.nullable().optional(),
    preSaleEnd: IValidateDate.nullable().optional(),

    discountCodes: z.array(DiscountCodeSchema).nullable().optional(),
    ...OrganizerSchema.shape,
    description: z.string({ required_error: "Description is required" }).trim(),
    isDraft: z.boolean().optional(),
  })
    // ✅ FIX: Custom validation - paid event হলে tickets required
    .refine(
      (data) => {
        // যদি paid event হয় তাহলে tickets থাকতে হবে
        if (data.isFreeEvent === false || data.isFreeEvent === undefined) {
          return data.tickets && data.tickets.length > 0;
        }
        // Free event হলে tickets optional
        return true;
      },
      {
        message: "At least one ticket type is required for paid events",
        path: ["tickets"],
      }
    ),
});
// Update Event
const UpdateEventZodSchema = z.object({
  body: z.object({
    eventName: z.string().trim().optional(),
    image: z.string().optional(),
    category: z
      .array(
        z.object({
          categoryId: z.string().length(24, "Invalid CategoryId length"),
          subCategory: z.array(z.string().length(24, "Invalid SubCategoryId length")),
        })
      )
      .optional(),
    tags: z.array(z.string().trim()).optional(),
    eventDate: IValidateDate.nullable().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    notification: z.string().optional(),
    streetAddress: z.string().trim().optional(),
    streetAddress2: z.string().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    country: z.string().trim().optional(),
    isFreeEvent: z.boolean().optional(),
    tickets: z.array(TicketSchema).optional(),
    ticketSaleStart: IValidateDate.nullable().optional(),
    preSaleStart: IValidateDate.nullable().optional(),
    preSaleEnd: IValidateDate.nullable().optional(),
    discountCodes: z.array(DiscountCodeSchema).nullable().optional(),
    ...OrganizerSchema.shape,
    description: z.string().trim().optional(),
    isDraft: z.boolean().optional(),
  })
    // ✅ Update এর সময়ও paid event check করবে (যদি isFreeEvent update করা হয়)
    .refine(
      (data) => {
        // যদি isFreeEvent explicitly false করা হয় তাহলে tickets check করবে
        if (data.isFreeEvent === false) {
          return data.tickets && data.tickets.length > 0;
        }
        return true;
      },
      {
        message: "At least one ticket type is required for paid events",
        path: ["tickets"],
      }
    ),
});



export const EventValidation = {
  DraftEventZodSchema,
  FullEventZodSchema,
  UpdateEventZodSchema,
};