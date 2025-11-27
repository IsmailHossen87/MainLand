import { Router } from "express"
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { TicketController } from "./ticket.controller";
import { PaymentController } from "../Payment/paymentController";


const router = Router()

router.get('/getAllTicket', auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), TicketController.getAllTicket);
router.get('/uniqueEvents', auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), TicketController.getUniqueEvents);
router.get('/sellAllTicket', auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), TicketController.allOnsellTicketInfo);

router.post('/ticketPurchase', auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), PaymentController.buyTicket);  // Ticket Purchase --payment
router.get("/soldTickethistory", auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), TicketController.soldTicket);
router.get('/expiredTicket', auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), TicketController.ticketExpired);
router.get('/withdrawTicket/:id', auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), TicketController.withdrawTicket);
// router.get("/barCodeGenerate", auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), TicketController.barCodeGenerate); //barcode generate
router.get('/sellHistory/:id', auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), TicketController.sellTicketInfoUsers);
router.get('/resellTicket/:id', auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), TicketController.resellTicket);
router.get('/:id', auth(USER_ROLES.USER, USER_ROLES.ORGANIZER), TicketController.getOneTicket);




export const TicketRouter = router