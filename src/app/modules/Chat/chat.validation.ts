import { z } from "zod";

export const createOneToOneChatValidation = z.object({
    params: z.object({
        otherUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    }),
});