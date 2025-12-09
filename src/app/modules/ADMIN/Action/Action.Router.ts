import { Router } from 'express';
import { USER_ROLES } from '../../../../enums/user';
import { ActionController } from './ActionController';
import auth from '../../../middlewares/auth';

const router = Router();
router.get("/dashboard", auth(USER_ROLES.ADMIN), ActionController.DashBoard)
router.get("/account-delete-history", auth(USER_ROLES.ADMIN), ActionController.accountDeleteHistory)
router.get("/all-notification", auth(USER_ROLES.ADMIN), ActionController.allNotification)
router.get("/all-user", auth(USER_ROLES.ADMIN), ActionController.AllTicketBuyerUser)
router.patch('/block-user/:id', auth(USER_ROLES.ADMIN), ActionController.blockUser);
router.get("/ticket-activity/:id", auth(USER_ROLES.ADMIN), ActionController.ticketActivity)
// .get("/allResellTicket",auth(USER_ROLES.ADMIN),ActionController.allResellTicket)
router.patch('/event/:id', auth(USER_ROLES.ADMIN), ActionController.statusChange);



export const ActionRouter = router;
