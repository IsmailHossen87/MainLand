import { Router } from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
import { messageController } from "./message-controller";

const router = Router();

router.post(
    "/",
    auth(USER_ROLES.USER, USER_ROLES.ORGANIZER),
    fileUploadHandler(),
    messageController.sendMessage
);

router.post(
    '/reply/:messageId',
    auth(USER_ROLES.USER, USER_ROLES.ORGANIZER, USER_ROLES.ADMIN),
    fileUploadHandler(),
    messageController.replyMessage
);

router.get(
    '/:id',
    auth(USER_ROLES.USER, USER_ROLES.ORGANIZER, USER_ROLES.ADMIN),
    messageController.getMessage
);

export const MessageRouter = router;