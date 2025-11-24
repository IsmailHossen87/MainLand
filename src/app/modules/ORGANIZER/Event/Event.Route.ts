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
  (req,res,next)=>{
    console.log("event crate hit hoise",req.body)
    next()
  },
  auth(USER_ROLES.ORGANIZER,USER_ROLES.USER),
  fileUploadHandler(),
  parseFormDataMiddleware,
  dynamicEventValidation,
  EventController.createEvent
);
// UPDATE category
router.get(
  "/subcategory",
  auth(USER_ROLES.ADMIN, USER_ROLES.ORGANIZER, USER_ROLES.USER),
  EventController.subCategory
);
router.get(
  "/allCategory",
  auth(USER_ROLES.ADMIN, USER_ROLES.ORGANIZER, USER_ROLES.USER),
  EventController.allCategory
);
// Draft update OR Create
router.patch(
  '/:id',
  auth(USER_ROLES.ORGANIZER,USER_ROLES.USER),
  fileUploadHandler(),
  parseFormDataMiddleware,
  dynamicEventValidation,
  EventController.updateEvent
);
// Update Category
router.patch(
  '/category/:id',
  auth(USER_ROLES.ADMIN,USER_ROLES.USER),
  fileUploadHandler(),
  EventController.updateCategory
);
// eventDate Expired Like Closed✅✅✅✅
router.get("/closed",auth(USER_ROLES.ORGANIZER,USER_ROLES.USER),EventController.closedEvent)


// sdakljfopaksejfl;kasdflkasdjflkasdjfokpadsf💛🩷❣️🩶🩷🖤🖤🩵❤️💛💚🤍🩷💛💙🩵❤️🧡💙🤎💜💙💜💜🤎 
router.get("/",auth(USER_ROLES.ORGANIZER,USER_ROLES.USER),EventController.allDataUseQuery) 

router.get("/allLiveEvent", auth(USER_ROLES.ORGANIZER), EventController.allLiveEvent)

router.get(
  "/:id",
  auth(USER_ROLES.ADMIN,USER_ROLES.ORGANIZER,USER_ROLES.USER),
  EventController.singleEvent
)
router.put("/category/:id", auth(USER_ROLES.ADMIN), fileUploadHandler(),
  parseFormDataMiddleware,EventController.updateCategory);

export const EventRoutes = router;
