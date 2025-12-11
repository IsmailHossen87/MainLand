"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRoutes = void 0;
const express_1 = require("express");
const Event_Controller_1 = require("./Event.Controller");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const user_1 = require("../../../../enums/user");
const fileUploadHandler_1 = __importDefault(require("../../../middlewares/fileUploadHandler"));
const ParseFormData_1 = require("../../../middlewares/ParseFormData");
const DaynamicEventValidation_1 = require("./DaynamicEventValidation");
const paymentController_1 = require("../../Payment/paymentController");
const router = (0, express_1.Router)();
/* -----------------------------------------
   🌸 SUB-CATEGORY CREATE
------------------------------------------ */
router.post('/subcategory', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), Event_Controller_1.EventController.createSubCategory);
/* -----------------------------------------
   📂 CATEGORY CREATE (With File Upload)
------------------------------------------ */
router.post('/category', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), (0, fileUploadHandler_1.default)(), ParseFormData_1.parseFormDataMiddleware, Event_Controller_1.EventController.createCategory);
/* -----------------------------------------
   📝 EVENT CREATE OR SAVE DRAFT
------------------------------------------ */
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), (0, fileUploadHandler_1.default)(), ParseFormData_1.parseFormDataMiddleware, DaynamicEventValidation_1.dynamicEventValidation, Event_Controller_1.EventController.createEvent);
/* -----------------------------------------
   📂 GET SUB-CATEGORY
------------------------------------------ */
router.get('/subcategory', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), Event_Controller_1.EventController.subCategory);
/* -----------------------------------------
   📂 GET ALL CATEGORY
------------------------------------------ */
router.get('/allCategory', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), Event_Controller_1.EventController.allCategory);
/* -----------------------------------------
   🛑 CLOSED EVENTS
------------------------------------------ */
router.get('/closed', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), Event_Controller_1.EventController.closedEvent);
/* -----------------------------------------
   🌈 (Decorative Section) ALL DATA (Query Based)
------------------------------------------ */
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN), Event_Controller_1.EventController.allDataUseQuery);
router.get('/under-review', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN), Event_Controller_1.EventController.AllUnderReview);
/* -----------------------------------------
   ✏️ EVENT UPDATE (Draft or Normal)
------------------------------------------ */
router.patch('/:id', (req, res, next) => {
    console.log("hhhhhhhhhhhhhh", req.body);
    next();
}, (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), (0, fileUploadHandler_1.default)(), ParseFormData_1.parseFormDataMiddleware, DaynamicEventValidation_1.dynamicEventValidation, Event_Controller_1.EventController.updateEvent);
/* -----------------------------------------
   ✏️ EVENT UPDATE (Draft or Normal)
------------------------------------------ */
router.patch('/notification/:id', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER), (0, fileUploadHandler_1.default)(), Event_Controller_1.EventController.updateNotification);
/* -----------------------------------------
   ✏️ CATEGORY UPDATE
------------------------------------------ */
router.patch('/category/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), (0, fileUploadHandler_1.default)(), Event_Controller_1.EventController.updateCategory);
/* -----------------------------------------
   ✏️ CATEGORY UPDATE
------------------------------------------ */
router.patch('/subcategory/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), Event_Controller_1.EventController.updateSubCategory);
/* -----------------------------------------
   💳 PAYMENT EVENT
------------------------------------------ */
router
    .route('/payment/:id')
    .post((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), paymentController_1.PaymentController.createEventPayment);
/* -----------------------------------------
   ✏️ CATEGORY UPDATE
------------------------------------------ */
router.delete('/category-subcategory/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), (0, fileUploadHandler_1.default)(), Event_Controller_1.EventController.deleteCategory);
/* -----------------------------------------
   🎬 ALL LIVE EVENTS
------------------------------------------ */
router.get('/all-live-event', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), Event_Controller_1.EventController.allLiveEvent);
/* -----------------------------------------
   🅿️ POPULAR EVENTS
------------------------------------------ */
router.get('/popular-event', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), Event_Controller_1.EventController.popularEvent);
/* -----------------------------------------
   🔍 SINGLE EVENT
------------------------------------------ */
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), Event_Controller_1.EventController.singleEvent);
/* -----------------------------------------
   🔍 EVENT HISTORY
------------------------------------------ */
router.get('/event-ticket-history/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), Event_Controller_1.EventController.eventTicketHistory);
/* -----------------------------------------
   🧩 PUT CATEGORY UPDATE
------------------------------------------ */
router.put('/category/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), (0, fileUploadHandler_1.default)(), ParseFormData_1.parseFormDataMiddleware, Event_Controller_1.EventController.updateCategory);
router.patch("/bar-code-check/:id", (req, res, next) => {
    console.log("Ticket Information", req.body);
    next();
}, (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), Event_Controller_1.EventController.barCodeCheck);
router.get("/perticipent-count/:eventCode", (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), Event_Controller_1.EventController.perticipentCount);
exports.EventRoutes = router;
