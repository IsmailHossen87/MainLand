import { z } from "zod";

// ✅ Draft Schema - সব optional
const DraftEventZodSchema = z.object({
  body: z.object({
    eventName: z.string().optional(),
    title: z.string().optional(),
    image: z.string().optional(),
    category: z.array(z.string()).optional(),
    location: z.string().optional(),
    startTime: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      { message: "Start time must be a valid date" }
    ).optional(),
    endTime: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      { message: "End time must be a valid date" }
    ).optional(),
    address: z.string().optional(),
    description: z.string().optional(),
    isDraft: z.boolean().optional(),  
  }),
});

// ✅ Full Event Schema - সব required
const FullEventZodSchema = z.object({
  body: z.object({
    eventName: z.string({ required_error: "Event name is required" }),
    title: z.string({ required_error: "Title is required" }),
    image: z.string({ required_error: "Image is required" }),
    category: z.array(z.string()).min(1, "At least one category required"),
    location: z.string({ required_error: "Location is required" }),
    startTime: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      { message: "Start time must be a valid date" }
    ),
    endTime: z.string().refine(
      (val) => !isNaN(Date.parse(val)),
      { message: "End time must be a valid date" }
    ),
    address: z.string({ required_error: "Address is required" }),
    description: z.string({ required_error: "Description is required" }),
    isDraft: z.boolean().optional(),
  }),
});

export const EventValidation ={DraftEventZodSchema,FullEventZodSchema}