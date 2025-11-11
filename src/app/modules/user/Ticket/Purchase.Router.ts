import { Router } from "express";
import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";
import { PurchaseController } from "./Purchase.Controllet";
import { PaymentController } from "../../Payment/paymentController";

const router = Router();

router
  .route('/payment/:id')
  .post(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.ORGANIZER),
    PaymentController.createPaymentIntentEvent
  )



export const PurchaseRouter = router;
