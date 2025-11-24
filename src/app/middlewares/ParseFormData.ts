import { Request, Response, NextFunction } from 'express';

export const parseFormDataMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.body?.data) {
      console.log('No parsed Data', req?.body?.data);
      const parsed = JSON.parse(req.body.data);
      console.log('Parsed data:', parsed);
      req.body = { ...parsed };
    }
    next();
  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.error('Received data:', req.body?.data);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format in form-data "data" field',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
