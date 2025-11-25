import { Router } from 'express';
import { SettingController } from './SettingController';


const router = Router();


router.put("/", SettingController.updateSetting);
// router.get("/", SettingController.getSettings);
// router.get("/:key", SettingController.specificSetting);

export const  SettingRouter =router;;