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
   💳 PAYMENT EVENT
------------------------------------------ */
router
  .route('/payment/:id')
  .post(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.ORGANIZER),
    PaymentController.createEventPayment
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
  (req, res, next) => {
    console.log('event crate hit hoise', req.body);
    next();
  },
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
   ✏️ EVENT UPDATE (Draft or Normal)
------------------------------------------ */
router.patch(
  '/:id',
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  fileUploadHandler(),
  parseFormDataMiddleware,
  dynamicEventValidation,
  EventController.updateEvent
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
  auth(USER_ROLES.ORGANIZER, USER_ROLES.USER),
  EventController.allDataUseQuery
);

/* -----------------------------------------
   🎬 ALL LIVE EVENTS
------------------------------------------ */
router.get(
  '/allLiveEvent',
  auth(USER_ROLES.ORGANIZER),
  EventController.allLiveEvent
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
   🧩 PUT CATEGORY UPDATE
------------------------------------------ */
router.put(
  '/category/:id',
  auth(USER_ROLES.ADMIN),
  fileUploadHandler(),
  parseFormDataMiddleware,
  EventController.updateCategory
);

export const EventRoutes = router;
