import express, { NextFunction, Request, Response, Router } from 'express';
import { NotificationController } from './notification.controller';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';


const router = Router();

router.patch('/send-notification/:eventId', auth(USER_ROLES.ADMIN), NotificationController.sendAdminNotification);

router.get('/', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER), NotificationController.getNotificationFromDB);
router.get('/unread-count', auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.ORGANIZER), NotificationController.getUnreadNotificationCount);

// router.get('/all-notification', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), NotificationController.getAllNotification);

// //single Notification,getNotification,updateNotification
// router
//   .route('/:id')
//   .get(auth(USER_ROLES.ADMIN), NotificationController.getNotificationById)
//   .patch(auth(USER_ROLES.ADMIN), dynamicNotifaicationValidation, NotificationController.updateNotification)
//   .delete(auth(USER_ROLES.ADMIN), NotificationController.deleteNotification);

export const NotificationRoutes = router;
