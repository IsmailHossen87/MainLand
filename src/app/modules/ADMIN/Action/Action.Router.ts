import { Router } from 'express';
import { USER_ROLES } from '../../../../enums/user';
import { ActionController } from './ActionController';
import auth from '../../../middlewares/auth';

const router = Router();
router
    .get("/dashboard", auth(USER_ROLES.ADMIN), ActionController.DashBoard)
router.patch('/block-user/:id', auth(USER_ROLES.ADMIN), ActionController.blockUser);
// .get("/allUser",auth(USER_ROLES.ADMIN),ActionController.AllTicketBuyer)
// .get("/ticketActivity",auth(USER_ROLES.ADMIN),ActionController.ticketActivity)
// .get("/allResellTicket",auth(USER_ROLES.ADMIN),ActionController.allResellTicket)
router.patch('/event/:id', auth(USER_ROLES.ADMIN), ActionController.statusChange);



export const ActionRouter = router;
