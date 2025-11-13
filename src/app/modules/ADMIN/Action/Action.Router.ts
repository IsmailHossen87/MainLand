import { Router } from 'express';
import { USER_ROLES } from '../../../../enums/user';
import { ActionController } from './ActionController';
import auth from '../../../middlewares/auth';

const router = Router();
router
.get("/dashboard",auth(USER_ROLES.ADMIN),ActionController.DashBoard)
.get("/allUser",auth(USER_ROLES.ADMIN),ActionController.AllTicketBuyer)

router.patch('/event/:id', auth(USER_ROLES.ADMIN), ActionController.statusChange);


export const ActionRouter = router;
