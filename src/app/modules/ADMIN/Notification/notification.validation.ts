import { z } from 'zod';

export const NotificationValidation = {
  createNotificationSchema: z.object({
    type: z.string().nonempty(),
    title: z.string().nonempty(),
    recipientGroup: z.string().nonempty(),
    dateSent: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
    status: z.enum(['Sent', 'Draft']),
    recipientType: z.enum(['Active', 'Closed', 'Winner Announced']),
  }),

  updateNotificationSchema: z.object({
    type: z.string().optional(),
    title: z.string().optional(),
    recipientGroup: z.string().optional(),
    dateSent: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
    status: z.enum(['Sent', 'Draft']).optional(),
    recipientType: z.enum(['Active', 'Closed', 'Winner Announced']).optional(),
  }),
};
