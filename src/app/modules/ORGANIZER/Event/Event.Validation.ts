import { z } from 'zod';

// 🎫 Enum for Ticket Type
export const TicketTypeEnum = z.enum(['Premium', 'VIP', 'Standard']);

// 🧾 Ticket Schema
const TicketSchema = z.object({
  type: TicketTypeEnum,
  price: z.number().min(0, 'Price must be positive'),
  availableUnits: z.number().int().min(1, 'At least 1 ticket required'),
});

// 💸 Discount Code Schema
const DiscountCodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  percentage: z.number().min(0).max(100),
});

const OrganizerSchema = z.object({
  organizerName: z.string().optional(),
  organizerType: z.string().optional(),
  organizerEmail: z.string().email('Invalid email').optional(),
  organizerPhone: z.string().optional(),
});

const validDate = z
  .string()
  .refine(val => !isNaN(Date.parse(val)), { message: 'Must be a valid date' });

const DraftEventZodSchema = z.object({
  body: z.object({
    eventName: z.string(),
    title: z.string(),
    image: z.string().optional(),
    category: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),

    eventDate: validDate.optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),

    address: z.string().optional(),
    streetAddress: z.string().optional(),
    streetAddress2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),

    tickets: z.array(TicketSchema).optional(),

    ticketSaleStart: validDate.optional(),
    ticketSaleEnd: validDate.optional(),
    preSaleStart: validDate.optional(),
    preSaleEnd: validDate.optional(),

    discountCodes: z.array(DiscountCodeSchema).optional(),

    ...OrganizerSchema.shape,

    description: z.string().optional(),
    isDraft: z.boolean().optional(),
  }),
});

// ✅ Full Event Schema (Required fields)
const FullEventZodSchema = z.object({
  body: z.object({
    eventName: z.string({ required_error: 'Event name is required' }),
    title: z.string({ required_error: 'Title is required' }),
    image: z.string({ required_error: 'Image is required' }),
    category: z.array(z.string(), { required_error: 'Category is required' }),
    tags: z.array(z.string()).optional(),

    eventDate: validDate,
    startTime: z.string(),
    endTime: z.string(),

    address: z.string({ required_error: 'Address is required' }),
    city: z.string({ required_error: 'City is required' }),
    state: z.string({ required_error: 'State is required' }),
    country: z.string({ required_error: 'Country is required' }),

    tickets: z
      .array(TicketSchema)
      .min(1, 'At least one ticket type is required'),

    ticketSaleStart: validDate.optional(),
    ticketSaleEnd: validDate.optional(),
    preSaleStart: validDate.optional(),
    preSaleEnd: validDate.optional(),

    discountCodes: z.array(DiscountCodeSchema).optional(),
    ...OrganizerSchema.shape,

    description: z.string({ required_error: 'Description is required' }),
    isDraft: z.boolean().optional(),
  }),
});

export const EventValidation = {
  DraftEventZodSchema,
  FullEventZodSchema,
};
