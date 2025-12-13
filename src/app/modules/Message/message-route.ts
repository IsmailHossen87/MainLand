import { Router } from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
import { messageController } from "./message-controller";
import { parseMultipleFilesdata } from "../../middlewares/ParseMultipleFileData";

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
    parseMultipleFilesdata('image'),
    messageController.replyMessage
);

router.get(
    '/:id',
    auth(USER_ROLES.USER, USER_ROLES.ORGANIZER, USER_ROLES.ADMIN),
    messageController.getMessage
);

router.patch("/update-message/:id", auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), fileUploadHandler(), messageController.updateMessage)
router.delete("/delete-message/:id", auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), messageController.deleteMessage)
export const MessageRouter = router;