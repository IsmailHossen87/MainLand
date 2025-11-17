import { Router } from 'express';
import { EventController } from './Event.Controller';
import auth from '../../../middlewares/auth';
import { USER_ROLES } from '../../../../enums/user';
import fileUploadHandler from '../../../middlewares/fileUploadHandler';
import { parseFormDataMiddleware } from '../../../middlewares/ParseFormData';
import { dynamicEventValidation } from './DaynamicEventValidation';
import { PaymentController } from '../../Payment/paymentController';

const router = Router();
// create SubCategory
router.post('/subcategory',auth(USER_ROLES.ADMIN), EventController.createSubCategory);
// paymentEVENT
router
  .route('/payment/:id')
  .post(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.ORGANIZER),
    PaymentController.createEventPayment
  )

// create Category
router.post(
  '/category',
  auth(USER_ROLES.ADMIN),
  fileUploadHandler(),
  parseFormDataMiddleware,
  EventController.createCategory
);

// saveDraft or Create
router.post(
  '/',
  auth(USER_ROLES.ORGANIZER),
  fileUploadHandler(),
  parseFormDataMiddleware,
  dynamicEventValidation,
  EventController.createEvent
);

// Draft update OR Create
router.patch(
  '/:id',
  auth(USER_ROLES.ORGANIZER),
  fileUploadHandler(),
  parseFormDataMiddleware,
  dynamicEventValidation,
  EventController.updateEvent
);
// Update Category
router.patch(
  '/category/:id',
  auth(USER_ROLES.ADMIN),
  fileUploadHandler(),
  EventController.updateCategory
);
// eventDate Expired Like Closed✅✅✅✅
router.get("/closed",auth(USER_ROLES.ORGANIZER),EventController.closedEvent)
// AllDraft ✅✅✅
router.get("/",auth(USER_ROLES.ORGANIZER),EventController.allDraftEvent)
// GET Pending ✅✅
router.get(
  "/myEvent",
  auth(USER_ROLES.ORGANIZER),
  EventController.myEvents
)
// Live Event ✅
router.get(
  "/liveEvent",
  auth(USER_ROLES.ORGANIZER),
  EventController.MyLiveEvent
)

// SHOW ALL Live event For User
router.get(
  "/AllEvent",
  auth(USER_ROLES.ORGANIZER,USER_ROLES.ADMIN,USER_ROLES.USER),
  EventController.AllLiveEvent
)
// Details
router.get(
  "/:id",
  auth(USER_ROLES.ADMIN,USER_ROLES.ORGANIZER,USER_ROLES.USER),
  EventController.singleEvent
)
// UPDATE category
router.put("/category/:id", auth(USER_ROLES.ADMIN), fileUploadHandler(),
  parseFormDataMiddleware,EventController.updateCategory);

export const EventRoutes = router;
