import { Router } from "express";
import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";

import { ResellTicketController } from "./Purchase.Controllet";

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
  ResellTicketController.getResellTickets
);

// 🎟️ Buy a resell ticket
router.post(
  "/buy/:resellTicketId",
  auth(USER_ROLES.USER),
  ResellTicketController.buyResellTicket
);

// 🎟️ Cancel a resell listing
router.patch(
  "/cancel/:resellTicketId",
  auth(USER_ROLES.USER),
  ResellTicketController.cancelResellListing
);


export const ReSellRoute = router;
