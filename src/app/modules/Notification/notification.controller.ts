import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service';
import { INotification } from './notification.interface';
import { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';

// send admin notifications to the users accaunts
// CONTROLLER
const sendAdminNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId } = req.params;
    const user = req.user as JwtPayload;
    const status = req.query.status as "success" | "rejected";

    await NotificationService.sendAdminNotification(eventId, user, status);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    next(error);
  }
};


const getNotificationFromDB = catchAsync(async (req, res) => {
  const user: any = req.user;
  const result = await NotificationService.getNotificationFromDB(user, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications Retrieved Successfully',
    data: result.data,

  });
});

const getUnreadNotificationCount = catchAsync(async (req, res) => {
  const user: any = req.user;
  const result = await NotificationService.getUnreadNotificationCount(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Unread Notification Count Retrieved Successfully',
    data: {
      notificationCount: result.notificationCount,
      messageCount: result.messageCount || 0,
    },
  });
});



// const updateNotification = catchAsync(async (req: Request, res: Response) => {
//   const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';
//   const user = req?.user as JwtPayload;
//   const result = await NotificationService.updateNotification(
//     req.params.id,
//     user,
//     { ...req.body, isDraft }
//   );
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: isDraft
//       ? 'Notification updated successfully'
//       : 'Notification published successfully',
//     data: result,
//   });
// });
// GET ALL NOTIFICATION
// const getAllNotification = catchAsync(async (req: Request, res: Response) => {
//   const query = req.query
//   const user = req.user as JwtPayload
//   const result = await NotificationService.getAllNotifications(query as Record<string, string>, user)
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: 'Notification Retrived successfully',
//     meta: result.meta,
//     data: result.data,

//   });
// })

// const getNotificationById = catchAsync(async (req: Request, res: Response) => {
//   const result = await NotificationService.getNotificationById(req.params.id);
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: 'Notification fetched successfully',
//     data: result,
//   });
// });


// const deleteNotification = catchAsync(async (req: Request, res: Response) => {
//   const result = await NotificationService.deleteNotification(req.params.id);
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: 'Notification deleted successfully',
//     data: result,
//   });
// });

// const getNotificationCount = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user;
//   const result = await NotificationService.getNotificationCount(user);
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: 'Notification count fetched successfully',
//     data: result,
//   });
// });

export const NotificationController = {
  sendAdminNotification,
  getNotificationFromDB,
  getUnreadNotificationCount,
  // getNotificationById,
  // updateNotification,
  // deleteNotification,
  // getNotificationCount,
  // getAllNotification
};
