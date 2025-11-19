import { Router } from "express";
import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";

import { ResellTicketController } from "./Purchase.Controllet";
import { PaymentController } from "../../Payment/paymentController";

const router = Router();


// 🎟️ Create a resell listing
router.post(
  "/",
  auth(USER_ROLES.USER),
  ResellTicketController.createResellListing
);

// 🎟️ Get all available resale tickets
router.get(
  "/available",
  ResellTicketController.availAbleTicket
);
// 🎟️ Get all live  tickets
router.get(
  "/live",
  ResellTicketController.getLiveTicket
);
// 🎟️ Get all sold tickets
router.get(
  "/solded",
  auth(USER_ROLES.USER),
  ResellTicketController.getSoldedTicket
);

// 🎟️ Buy a resell ticket
router.post(
  "/buy/:resellTicketId",
  auth(USER_ROLES.USER),
  PaymentController.createTicketPayment
);




export const TicketRoute = router;
