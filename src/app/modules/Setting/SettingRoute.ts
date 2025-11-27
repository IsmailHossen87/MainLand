import { Router } from 'express';
import { SettingController } from './SettingController';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';


const router = Router();


router.put("/", SettingController.updateSetting);
router.post("/faq", auth(USER_ROLES.ADMIN), SettingController.faqCreate);
router.get("/faq", auth(USER_ROLES.ADMIN), SettingController.getQuestion);
router.get("/faq/:id", auth(USER_ROLES.ADMIN), SettingController.getQuestionById);
router.get("/:key", SettingController.getSpecificSetting);

export const SettingRouter = router;