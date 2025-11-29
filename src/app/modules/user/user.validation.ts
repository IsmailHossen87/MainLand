import { z } from 'zod';
import { USER_ROLES } from '../../../enums/user';
import { IValidateDate } from '../ORGANIZER/Event/Event.Validation';

const createUserZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).optional(),
    email: z.string().email({ message: 'Invalid email format' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }),
    bio: z.string().optional(),
    image: z.string().url().optional(),
  }),
});
const updateUserZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    role: z.nativeEnum(USER_ROLES).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    bio: z.string().optional(),
    image: z.string().url().optional(),

    personalInfo: z
      .object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        bio: z.string().optional(),
        // ✨ NEW: Date of Birth validation
        dateOfBirth: IValidateDate.nullable().optional(),
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

    // ✨ NEW: Notification validation
    notification: z
      .object({
        isSellTicketNotificationEnabled: z.boolean().optional(),
        isMessageNotificationEnabled: z.boolean().optional(),
        isPublishEventNotificationEnabled: z.boolean().optional(),
        isWithdrawMoneyNotificationEnabled: z.boolean().optional(),
      })
      .optional(),
  }),
});



export const UserValidation = {
  createUserZodSchema, updateUserZodSchema
};