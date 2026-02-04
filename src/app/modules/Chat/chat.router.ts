import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { ChatController } from './chat.controller';
import { createOneToOneChatValidation } from './chat.validation';
const router = express.Router();

router.post('/:otherUserId', auth(USER_ROLES.ORGANIZER, USER_ROLES.USER), validateRequest(createOneToOneChatValidation), ChatController.createOneToOneChat);
router.get('/', auth(USER_ROLES.ORGANIZER, USER_ROLES.USER), ChatController.getAllChatList);
// Report
router.post(
    '/report/:chatId',
    auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
    ChatController.createReport
);


router.get(
    '/reports',
    auth(USER_ROLES.ADMIN),
    ChatController.getAllReports
);

// Get Reports By User
router.get(
    '/reports/:userId',
    auth(USER_ROLES.ORGANIZER, USER_ROLES.USER, USER_ROLES.ADMIN),
    ChatController.getReportsByUser
);


export const ChatRoutes = router;
