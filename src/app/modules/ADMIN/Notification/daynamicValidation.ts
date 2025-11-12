import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { NotificationValidation } from './notification.validation';



export const dynamicNotifaicationValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';

    let schema: AnyZodObject;
    if (isDraft) {
      schema =NotificationValidation.DraftNotificationZodSchema
    } else {
      schema = NotificationValidation.FullNotificationZodSchema;
    }
    await schema.parseAsync({
      body: req.body,
    });

    next();
  } catch (error) {
    next(error);
  }
};