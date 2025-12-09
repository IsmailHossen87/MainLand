import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { ChatController } from './chat.controller';
import { createOneToOneChatValidation } from './chat.validation';
const router = express.Router();

router.post('/:otherUserId', auth(USER_ROLES.ORGANIZER, USER_ROLES.USER), validateRequest(createOneToOneChatValidation), ChatController.createOneToOneChat);


export const ChatRoutes = router;
