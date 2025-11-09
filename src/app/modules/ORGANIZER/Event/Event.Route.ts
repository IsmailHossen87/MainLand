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
export const EventRoutes = router;
