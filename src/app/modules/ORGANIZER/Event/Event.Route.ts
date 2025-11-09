import { Router } from 'express';
import { EventController } from './Event.Controller';
import auth from '../../../middlewares/auth';
import { USER_ROLES } from '../../../../enums/user';
import fileUploadHandler from '../../../middlewares/fileUploadHandler';
import { parseFormDataMiddleware } from '../../../middlewares/ParseFormData';
import { dynamicEventValidation } from './DaynamicEventValidation';

const router = Router();

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
// Details
router.get(
  "/:id",
  auth(USER_ROLES.ADMIN,USER_ROLES.ORGANIZER,USER_ROLES.USER),
  EventController.singleEvent
)
export const EventRoutes = router;
