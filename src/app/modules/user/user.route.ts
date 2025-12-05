import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import { parseFormDataMiddleware } from '../../middlewares/ParseFormData';

const router = express.Router();
const allUser = auth(USER_ROLES.ORGANIZER, USER_ROLES.ADMIN, USER_ROLES.USER)

router
  .route('/profile')
  .get(
    allUser,
    UserController.getUserProfile
  )
  .patch(
    allUser,
    fileUploadHandler(),
    parseFormDataMiddleware,
    validateRequest(UserValidation.updateUserZodSchema),
    UserController.updateProfile
  );


router.route('/').get(UserController.getAllUser);
router.put("/mainland-fee", (auth(USER_ROLES.ADMIN)), UserController.CreateAndUpdateMainlandFee);

router
  .route('/create')
  .post(
    validateRequest(UserValidation.createUserZodSchema),
    UserController.createUser
  );
router.route("/remove-image")
  .delete(allUser, UserController.imageDelete)
router.route("/remove-account")
  .delete(allUser, UserController.accountDelete);


export const UserRoutes = router;
