import { Router } from 'express';
import { SettingController } from './SettingController';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';


const router = Router();


router.put("/", SettingController.updateSetting);
router.post("/faq", auth(USER_ROLES.ADMIN), SettingController.faqCreate);
router.post("/contact", auth(USER_ROLES.ADMIN, USER_ROLES.ORGANIZER, USER_ROLES.USER), SettingController.contactCreate);

router.get("/contact", auth(USER_ROLES.ADMIN), SettingController.getContact);
router.patch("/contact-email/:id", auth(USER_ROLES.ADMIN), SettingController.contactEmail);
router.get("/contact/:id", auth(USER_ROLES.ADMIN), SettingController.getContactById);

// faq
router.get("/faq/:faqType", auth(USER_ROLES.ADMIN, USER_ROLES.ORGANIZER, USER_ROLES.USER), SettingController.getQuestion);
router.get("/faq/:id", auth(USER_ROLES.ADMIN, USER_ROLES.ORGANIZER, USER_ROLES.USER), SettingController.getQuestionById);
router.get("/:key", SettingController.getSpecificSetting);

export const SettingRouter = router;