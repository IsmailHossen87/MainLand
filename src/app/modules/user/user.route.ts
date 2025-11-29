import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import { parseFormDataMiddleware } from '../../middlewares/ParseFormData';

const router = express.Router();

router
  .route('/profile')
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.ORGANIZER),
    UserController.getUserProfile
  )
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ORGANIZER, USER_ROLES.USER),
    fileUploadHandler(),
    parseFormDataMiddleware,
    (req, res, next) => {
      console.log('=== Before Validation ===');
      console.log('Body:', JSON.stringify(req.body));
      console.log('========================');
      next();
    },
    validateRequest(UserValidation.updateUserZodSchema),
    UserController.updateProfile
  );


router.route('/').get(UserController.getAllUser);

router
  .route('/create')
  .post(
    validateRequest(UserValidation.createUserZodSchema),
    UserController.createUser
  );

export const UserRoutes = router;
