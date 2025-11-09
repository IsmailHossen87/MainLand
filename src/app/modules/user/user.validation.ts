import { z } from 'zod';
import { USER_ROLES } from '../../../enums/user';

 const createUserZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    email: z.string().email({ message: 'Invalid email format' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }),
    contact: z.string().optional(),
    bio: z.string().optional(),
    image: z.string().url().optional(),
  }),
});
 const updateUserZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    role: z.nativeEnum(USER_ROLES),
    email: z.string().email({ message: 'Invalid email format' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }),
    contact: z.string().optional(),
    bio: z.string().optional(),
    image: z.string().url().optional(),
    personalInfo: z
      .object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        bio: z.string().optional(),
      })
      .optional(),
    address: z
      .object({
        country: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        street: z.string().optional(),
      })
      .optional(),
  }),
});


export const UserValidation = {
  createUserZodSchema,updateUserZodSchema
};