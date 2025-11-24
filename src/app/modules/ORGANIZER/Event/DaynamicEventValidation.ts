import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { EventValidation } from './Event.Validation';
import { createLogger } from 'winston';


export const dynamicEventValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';

    let schema: AnyZodObject;
    if (isDraft) {
      schema = EventValidation.DraftEventZodSchema;
    } else {
      // Full Event = Required fields
      schema = EventValidation.FullEventZodSchema;
    }
    await schema.parseAsync({
      body: req.body,
    });

    next();
  } catch (error) {
    next(error);
  }
};