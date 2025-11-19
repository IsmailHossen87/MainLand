import { Router } from 'express';
import { SettingController } from './SettingController';


const router = Router();

router.get("/", SettingController.getAllSettings);
router.put("/", SettingController.upsertSettings);//create
router.get("/:key", SettingController.specificSetting);

export const  SettingRouter =router;;