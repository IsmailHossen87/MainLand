import { Router } from 'express';
import { EventController } from './Event.Controller';
import auth from '../../../middlewares/auth';
import { USER_ROLES } from '../../../../enums/user';
import fileUploadHandler from '../../../middlewares/fileUploadHandler';
import { parseFormDataMiddleware } from '../../../middlewares/ParseFormData';
import { dynamicEventValidation } from './DaynamicEventValidation';
import { PaymentController } from '../../Payment/paymentController';

const router = Router();

/* -----------------------------------------
   🌸 SUB-CATEGORY CREATE
------------------------------------------ */
router.post(
  '/subcategory',
  auth(USER_ROLES.ADMIN),
  EventController.createSubCategory
);



/* -----------------------------------------
   📂 CATEGORY CREATE (With File Upload)
------------------------------------------ */
router.post(
  '/category',
  auth(USER_ROLES.ADMIN),
  fileUploadHandler(),
  parseFormDataMiddleware,
  EventController.createCategory
);

/* -----------------------------------------
   📝 EVENT CREATE OR SAVE DRAFT
------------------------------------------ */
router.post(
  '/',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  fileUploadHandler(),
  parseFormDataMiddleware,
  dynamicEventValidation,
  EventController.createEvent
);

/* -----------------------------------------
   📂 GET SUB-CATEGORY
------------------------------------------ */
router.get(
  '/subcategory',
  auth(USER_ROLES.ADMIN, USER_ROLES.ORGANIZER, USER_ROLES.USER),
  EventController.subCategory
);

/* -----------------------------------------
   📂 GET ALL CATEGORY
------------------------------------------ */
router.get(
  '/allCategory',
  auth(USER_ROLES.ADMIN, USER_ROLES.ORGANIZER, USER_ROLES.USER),
  EventController.allCategory
);

/* -----------------------------------------
   🛑 CLOSED EVENTS
------------------------------------------ */
router.get(
  '/closed',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  EventController.closedEvent
);

/* -----------------------------------------
   🌈 (Decorative Section) ALL DATA (Query Based)
------------------------------------------ */
router.get(
  '/',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER, USER_ROLES.ADMIN),
  EventController.allDataUseQuery
);
router.get(
  '/under-review',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER, USER_ROLES.ADMIN),
  EventController.AllUnderReview
);

/* -----------------------------------------
   ✏️ EVENT UPDATE (Draft or Normal)
------------------------------------------ */
router.patch(
  '/:id',
  (req, res, next) => {
    console.log("hhhhhhhhhhhhhh", req.body)
    next()
  },
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  fileUploadHandler(),
  parseFormDataMiddleware,
  dynamicEventValidation,
  EventController.updateEvent
);
/* -----------------------------------------
   ✏️ EVENT UPDATE (Draft or Normal)
------------------------------------------ */
router.patch(
  '/notification/:id',
  auth(USER_ROLES.ORGANIZER),
  fileUploadHandler(),
  EventController.updateNotification
);

/* -----------------------------------------
   ✏️ CATEGORY UPDATE
------------------------------------------ */
router.patch(
  '/category/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  fileUploadHandler(),
  EventController.updateCategory
);
/* -----------------------------------------
   ✏️ CATEGORY UPDATE
------------------------------------------ */
router.patch(
  '/subcategory/:id',
  auth(USER_ROLES.ADMIN),
  EventController.updateSubCategory
);
/* -----------------------------------------
   💳 PAYMENT EVENT
------------------------------------------ */
router
  .route('/payment/:id')
  .post(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.ORGANIZER),
    PaymentController.createEventPayment
  );
/* -----------------------------------------
   ✏️ CATEGORY UPDATE
------------------------------------------ */
router.delete(
  '/category-subcategory/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  fileUploadHandler(),
  EventController.deleteCategory
);



/* -----------------------------------------
   🎬 ALL LIVE EVENTS
------------------------------------------ */
router.get(
  '/all-live-event',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  EventController.allLiveEvent
);
/* -----------------------------------------
   🅿️ POPULAR EVENTS
------------------------------------------ */
router.get(
  '/popular-event',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  EventController.popularEvent
);

/* -----------------------------------------
   🔍 SINGLE EVENT
------------------------------------------ */
router.get(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.ORGANIZER, USER_ROLES.USER),
  EventController.singleEvent
);
/* -----------------------------------------
   🔍 EVENT HISTORY
------------------------------------------ */
router.get(
  '/event-ticket-history/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.ORGANIZER, USER_ROLES.USER),
  EventController.eventTicketHistory
);

/* -----------------------------------------
   🧩 PUT CATEGORY UPDATE
------------------------------------------ */
router.put(
  '/category/:id',
  auth(USER_ROLES.ADMIN),
  fileUploadHandler(),
  parseFormDataMiddleware,
  EventController.updateCategory
);

router.patch("/bar-code-check/:id", (req, res, next) => {
  console.log("Ticket Information", req.body)
  next()
}, auth(USER_ROLES.ORGANIZER, USER_ROLES.USER), EventController.barCodeCheck)

export const EventRoutes = router;
