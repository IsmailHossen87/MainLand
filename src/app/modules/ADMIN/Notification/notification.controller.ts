import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service';
import sendResponse from '../../../../shared/sendResponse';
import catchAsync from '../../../../shared/catchAsync';

const createNotification = catchAsync(async (req: Request, res: Response) => {

  const userId = req.user.id;
  req.body.userId = userId
  const result = await NotificationService.createNotification(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Notification created successfully',
    data: result,
  });
});

const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const { search, page, limit, ...query } = req.query;
  const user = req.user;
  
  const result = await NotificationService.getAllNotifications(
    { search, page, limit, ...query },
    user
  );
  
  sendResponse(res, {
    pagination: {
      ...result.meta,
    }, 
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications fetched successfully',
    data: result.result,
  });
});

const getNotificationById = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.getNotificationById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification fetched successfully',
    data: result,
  });
});

const updateNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.updateNotification(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification updated successfully',
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
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  getNotificationCount,
};
