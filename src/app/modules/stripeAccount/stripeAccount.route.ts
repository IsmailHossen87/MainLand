import { Router } from 'express';
import { stripeAccountController } from './stripeAccount.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';


// import { auth } from "../../middlewares/auth.js";

const stripeAccountRoutes = Router();
stripeAccountRoutes.post('/connected-user/login-link', auth(USER_ROLES.ORGANIZER, USER_ROLES.USER), stripeAccountController.stripeLoginLink);
stripeAccountRoutes
     .post('/create-connected-account', auth(USER_ROLES.ORGANIZER, USER_ROLES.USER), stripeAccountController.createStripeAccount)
     .get('/success-account/:id', stripeAccountController.successPageAccount)
     .get('/refreshAccountConnect/:id', stripeAccountController.refreshAccountConnect);

stripeAccountRoutes.get('/success-account/:accountId', stripeAccountController.onConnectedStripeAccountSuccess);


export default stripeAccountRoutes;
