import express, { NextFunction, Request, Response } from 'express';
import auth from '../../../middlewares/auth';
import { USER_ROLES } from '../../../../enums/user';
import validateRequest from '../../../middlewares/validateRequest';
import { NotificationController } from './notification.controller';
import { NotificationValidation } from './notification.validation';

const router = express.Router();

//create notification
router
  .route('/')
  .post(
    // validateRequest(NotificationValidation.createNotificationSchema),
    auth(USER_ROLES.ADMIN),
    NotificationController.createNotification
  )
  .get(auth(USER_ROLES.ADMIN), NotificationController.getAllNotifications);
  
//single Notification,getNotification,updateNotification
router
  .route('/:id')
  .get(auth(USER_ROLES.ADMIN), NotificationController.getNotificationById)
  .patch(
    auth(USER_ROLES.ADMIN),
    validateRequest(NotificationValidation.updateNotificationSchema),
    NotificationController.updateNotification
  )
  .delete(auth(USER_ROLES.ADMIN), NotificationController.deleteNotification);

export const NotificationRoutes = router;
