import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service';
import sendResponse from '../../../../shared/sendResponse';
import catchAsync from '../../../../shared/catchAsync';
import { JwtPayload } from 'jsonwebtoken';

const createNotification = catchAsync(async (req: Request, res: Response) => {

  const userId = req.user?.id as string;
  req.body.userId = userId 
  const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';
  const result = await NotificationService.createNotification({...req.body,isDraft});

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: isDraft
        ? 'Draft saved successfully'
        : 'Event created successfully',
    data: result,
  });
});
const updateNotification = catchAsync(async (req: Request, res: Response) => { 
  const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';
  const user = req?.user as JwtPayload;
  const result = await NotificationService.updateNotification(
    req.params.id,
    user,
    {...req.body,isDraft}
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: isDraft
        ? 'Notification updated successfully'
        : 'Notification published successfully',
    data: result,
  });
});
// GET ALL NOTIFICATION
const getAllNotification = catchAsync(async(req:Request,res:Response)=>{
  const query = req.query 
  const user = req.user as JwtPayload
  const result = await NotificationService.getAllNotifications(query as Record<string,string>,user) 
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification Retrived successfully',
    meta:result.meta,
    data: result.data,
    
  });
})

const getNotificationById = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.getNotificationById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification fetched successfully',
    data: result,
  });
});


const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.deleteNotification(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification deleted successfully',
    data: result,
  });
});

const getNotificationCount = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await NotificationService.getNotificationCount(user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification count fetched successfully',
    data: result,
  });
});

export const NotificationController = {
  createNotification,
  getNotificationById,
  updateNotification,
  deleteNotification,
  getNotificationCount,
  getAllNotification
};
