"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = require("../../user/user.model");
const Event_model_1 = require("./Event.model");
const user_1 = require("../../../../enums/user");
const constrant_1 = require("../../../../shared/constrant");
const mongoose_1 = require("mongoose");
const Event_interface_1 = require("./Event.interface");
const unlinkFile_1 = __importDefault(require("../../../../shared/unlinkFile"));
const Favourite_model_1 = require("../../Favoutite/Favourite.model");
const ticket_model_1 = require("../../Ticket/ticket.model");
const chat_model_1 = require("../../Chat/chat.model");
const AppError_1 = __importDefault(require("../../../../errors/AppError"));
const QueryBuilder_1 = require("../../../builder/QueryBuilder");
const notificatio_helper_1 = require("../../../../helpers/notificatio-helper");
const creteSubCategory = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.findById(payload.userId);
    if (!isExistUser || isExistUser.role != 'ADMIN') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "User doesn't exist!");
    }
    const createCategory = yield Event_model_1.SubCategory.create(payload);
    return createCategory;
});
const creteCategory = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.findById(payload.userId);
    if (!isExistUser || isExistUser.role != 'ADMIN') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "User doesn't exist!");
    }
    const createCategory = yield Event_model_1.Category.create(payload);
    return createCategory;
});
// UPDATEcategory
const updateCategory = (categoryId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield Event_model_1.Category.findById(categoryId);
    if (!category) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Category not found");
    }
    const updatedCategory = yield Event_model_1.Category.findByIdAndUpdate(categoryId, { $set: updateData }, { new: true, runValidators: true });
    if (!updateCategory) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Updated Category failed");
    }
    if (updateData.coverImage && category.coverImage) {
        (0, unlinkFile_1.default)(category.coverImage);
    }
    return updatedCategory;
});
// UPDATEcategory
const updateSubCategory = (categoryId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield Event_model_1.SubCategory.findByIdAndUpdate(categoryId, { $set: updateData }, { new: true, runValidators: true });
    if (!category) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "SubCategory not found");
    }
    return category;
});
// UPDATEcategory
const deleteCategory = (id, type) => __awaiter(void 0, void 0, void 0, function* () {
    if (type !== 'category' && type !== 'subCategory') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid type");
    }
    if (type === 'category') {
        const category = yield Event_model_1.Category.findByIdAndDelete(id);
        if (!category) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Category not found");
        }
        return category;
    }
    if (type === 'subCategory') {
        const subCategory = yield Event_model_1.SubCategory.findByIdAndDelete(id);
        if (!subCategory) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "SubCategory not found");
        }
        return subCategory;
    }
    return subCategory;
});
// // CREATE EVENT
// const createEvent = async (payload: any) => {
//   const { userId, eventName, isDraft } = payload;
//   // Check user exist
//   const isExistUser = await User.findById(userId);
//   if (!isExistUser) {
//     throw new AppError(StatusCodes.FORBIDDEN, "User doesn't exist!");
//   }
//   if (
//     isExistUser.role !== USER_ROLES.ORGANIZER &&
//     isExistUser.role !== USER_ROLES.USER
//   ) {
//     throw new AppError(
//       StatusCodes.FORBIDDEN,
//       "Only organizer and User can create Event"
//     );
//   }
//   // Category validation
//   if (payload.category?.length) {
//     const categoryIds = payload.category.map((c: any) => c.categoryId);
//     const categories = await Category.find({ _id: { $in: categoryIds } });
//     if (categories.length !== payload.category.length) {
//       throw new AppError(
//         StatusCodes.NOT_FOUND,
//         "One or more categories do not exist!"
//       );
//     }
//     payload.category = payload.category.map((c: any) => ({
//       categoryId: c.categoryId,
//       subCategory: c.subCategory,
//     }));
//   }
//   // If Event is a draft and already exists → update instead of creating new
//   if (isDraft) {
//     let event = await Event.findOne({ userId, eventName, isDraft: true });
//     if (event) {
//       // Auto-set outstandingUnits
//       if (payload.tickets?.length) {
//         payload.tickets = payload.tickets.map((t: any) => ({
//           ...t,
//           outstandingUnits: t.availableUnits,
//         }));
//       }
//       event = await Event.findByIdAndUpdate(
//         event._id,
//         { $set: payload },
//         { new: true, runValidators: true }
//       );
//       return event;
//     }
//   }
//   // New Event → Set EventStatus
//   payload.EventStatus = isDraft ? "Draft" : "UnderReview";
//   // Auto-set outstandingUnits for new event
//   if (payload.tickets?.length) {
//     payload.tickets = payload.tickets.map((t: any) => ({
//       ...t,
//       outstandingUnits: t.availableUnits,
//     }));
//   }
//   const event = await Event.create(payload);
//   return event;
// };
const createEvent = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { userId, eventName, isDraft } = payload;
    // ✅ Check if user exists
    const isExistUser = yield user_model_1.User.findById(userId);
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "User doesn't exist!");
    }
    // ✅ Check user role - শুধু Organizer এবং User event create করতে পারবে
    if (isExistUser.role !== user_1.USER_ROLES.ORGANIZER &&
        isExistUser.role !== user_1.USER_ROLES.USER) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only organizer and User can create Event");
    }
    // ✅ Category validation - categories exist করে কিনা check
    if ((_a = payload.category) === null || _a === void 0 ? void 0 : _a.length) {
        const categoryIds = payload.category.map((c) => c.categoryId);
        const categories = yield Event_model_1.Category.find({ _id: { $in: categoryIds } });
        if (categories.length !== payload.category.length) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "One or more categories do not exist!");
        }
        payload.category = payload.category.map((c) => ({
            categoryId: c.categoryId,
            subCategory: c.subCategory,
        }));
    }
    // ✅ If Event is a draft and already exists → update instead of creating new
    if (isDraft) {
        let event = yield Event_model_1.Event.findOne({ userId, eventName, isDraft: true });
        if (event) {
            // ✅ FIX: শুধুমাত্র tickets থাকলেই outstandingUnits set করবে
            if ((_b = payload.tickets) === null || _b === void 0 ? void 0 : _b.length) {
                payload.tickets = payload.tickets.map((t) => (Object.assign(Object.assign({}, t), { outstandingUnits: t.availableUnits })));
            }
            // Update existing draft
            event = yield Event_model_1.Event.findByIdAndUpdate(event._id, { $set: payload }, { new: true, runValidators: true });
            return event;
        }
    }
    // ✅ New Event → Set EventStatus based on draft
    payload.EventStatus = isDraft ? "Draft" : "UnderReview";
    // Free event এ tickets না থাকলে skip হবে
    if ((_c = payload.tickets) === null || _c === void 0 ? void 0 : _c.length) {
        payload.tickets = payload.tickets.map((t) => (Object.assign(Object.assign({}, t), { outstandingUnits: t.availableUnits })));
    }
    // Model এ default empty array আছে, তবে explicitly set করা ভালো
    if (payload.isFreeEvent && !payload.tickets) {
        payload.tickets = [];
    }
    // ✅ Create new event
    const event = yield Event_model_1.Event.create(payload);
    return event;
});
// UPDATE EVENT
const updateEvent = (eventId, userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Check event exists
    const event = yield Event_model_1.Event.findOne({ _id: eventId, userId });
    if (!event) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Event not found");
    }
    // Category validation
    if ((_a = payload.category) === null || _a === void 0 ? void 0 : _a.length) {
        const categoryIds = payload.category.map((c) => c.categoryId);
        const categories = yield Event_model_1.Category.find({ _id: { $in: categoryIds } });
        if (categories.length !== payload.category.length) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "One or more categories do not exist!");
        }
    }
    // Update EventStatus based on isDraft
    if ("isDraft" in payload) {
        payload.EventStatus = payload.isDraft ? "Draft" : "UnderReview";
    }
    // Auto-set outstandingUnits
    if ((_b = payload.tickets) === null || _b === void 0 ? void 0 : _b.length) {
        payload.tickets = payload.tickets.map((t) => (Object.assign(Object.assign({}, t), { outstandingUnits: t.availableUnits })));
    }
    const updatedEvent = yield Event_model_1.Event.findByIdAndUpdate(eventId, { $set: payload }, { new: true, runValidators: true });
    return updatedEvent;
});
// UPDATE Notification
const updateNotification = (eventId, userId, notification) => __awaiter(void 0, void 0, void 0, function* () {
    // Check event exists
    const event = yield Event_model_1.Event.findOne({ _id: eventId, userId });
    if (!event) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Event not found");
    }
    const updatedEvent = yield Event_model_1.Event.findByIdAndUpdate(eventId, { $set: { notification: notification } }, { new: true, runValidators: true });
    return updatedEvent;
});
const allLiveEvent = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const eventsToUpdate = yield Event_model_1.Event.find({ EventStatus: 'Live' }).select("eventDate EventStatus");
    for (const event of eventsToUpdate) {
        if (!event) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event is not available');
        }
        if (event.eventDate && event.eventDate < new Date()) {
            event.EventStatus = Event_interface_1.IEventStatus.Expired;
            yield event.save();
        }
    }
    const baseQuery = Event_model_1.Event.find({ EventStatus: 'Live' })
        .select("image eventName eventDate ticketSaleStart streetAddress2 streetAddress preSaleStart startTicketSale");
    const queryBuilder = new QueryBuilder_1.QueryBuilder(baseQuery, query);
    const allEvents = queryBuilder
        .search(constrant_1.excludeField)
        .filter()
        .dateRange()
        .sort()
        .fields()
        .paginate();
    const [meta, data] = yield Promise.all([
        allEvents.getMeta(),
        allEvents.build()
    ]);
    return { meta, data };
});
const popularEvent = (query) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Pagination setup
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    // Search setup
    const searchTerm = query.searchTerm || '';
    const searchCondition = searchTerm
        ? { eventName: { $regex: searchTerm, $options: 'i' } }
        : {};
    // Sort setup
    const sortField = query.sortBy || 'totalTicketBuyers';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const pipeline = [
        // ✅ ONLY LIVE EVENTS
        {
            $match: Object.assign({ EventStatus: "Live" }, searchCondition)
        },
        // Calculate total ticket buyers
        {
            $addFields: {
                totalTicketBuyers: {
                    $size: {
                        $reduce: {
                            input: "$tickets",
                            initialValue: [],
                            in: {
                                $setUnion: [
                                    "$$value",
                                    { $ifNull: ["$$this.ticketBuyerId", []] }
                                ]
                            }
                        }
                    }
                }
            }
        },
        // Sort
        { $sort: { [sortField]: sortOrder } },
        // Lookup category details
        {
            $lookup: {
                from: "categories",
                localField: "category.categoryId",
                foreignField: "_id",
                as: "categoryDetails",
            }
        },
        // Lookup subcategory details
        {
            $lookup: {
                from: "subcategories",
                localField: "category.subCategory",
                foreignField: "_id",
                as: "subcategoryDetails",
            }
        },
        // Lookup user details
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userDetails",
            }
        },
        {
            $unwind: {
                path: "$userDetails",
                preserveNullAndEmptyArrays: true,
            }
        },
        // Project only required fields
        {
            $project: {
                _id: 1,
                eventName: 1,
                image: 1,
                eventDate: 1,
                streetAddress: 1,
                streetAddress2: 1,
                isFreeEvent: 1,
                totalTicketBuyers: 1,
                totalEarned: 1
            }
        },
    ];
    // Count total documents (for meta)
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = yield Event_model_1.Event.aggregate(totalPipeline);
    const total = ((_a = totalResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });
    // Execute query
    const data = yield Event_model_1.Event.aggregate(pipeline);
    const meta = {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit)
    };
    return { meta, data };
});
// Single Event ✅✅✅✅
const singleEvent = (userID, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userID);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User is not Available");
    }
    // ✅ Chat only if userID exists in participants (2 IDs)
    const chat = yield chat_model_1.Chat.findOne({
        participants: { $in: [userID] },
    }).select("_id");
    const event = yield Event_model_1.Event.findById(eventId)
        .populate({
        path: "category.categoryId",
        select: "_id title",
    })
        .populate({
        path: "category.subCategory",
        select: "_id title",
    })
        .lean(); // 🔥 important
    if (!event) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Event is not Available");
    }
    return Object.assign(Object.assign({}, event), { chatId: chat ? chat._id : "" });
});
// all Closed ✅✅✅✅
const closedEvent = (userID, query) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userID);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User is not Available');
    }
    const todaysDate = new Date();
    // Query builder for closed events
    const queryBuilder = new QueryBuilder_1.QueryBuilder(Event_model_1.Event.find({ userId: user._id, isDraft: false, eventDate: { $lt: todaysDate } }), query);
    const closedEvents = queryBuilder
        .search(constrant_1.excludeField)
        .filter()
        .dateRange()
        .sort()
        .fields(['eventName',
        'eventDate',
        'image',
        '_id',
        'isFreeEvent',
        'streetAddress',
        'ticketSaleStart',
        'streetAddress2',
        'preSaleStart',])
        .paginate();
    const [meta, data] = yield Promise.all([
        closedEvents.getMeta(),
        closedEvents.build(),
    ]);
    if (!data || data.length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No closed events found");
    }
    return { meta, data };
});
// AllGetData 💛🩷🧡💙💜🤎
const allDataUseQuery = (userID, query) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userID);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User is not Available');
    }
    const { EventStatus: status, isDraft } = query;
    console.log(status);
    const today = new Date();
    const baseQuery = Event_model_1.Event.find({
        userId: user._id,
        $or: [
            { isDraft: isDraft },
            {
                EventStatus: status,
                eventDate: { $gte: today }
            },
        ]
    });
    // QueryBuilder chaining (search, filter, sort, pagination)
    const queryBuilder = new QueryBuilder_1.QueryBuilder(baseQuery, query);
    const allEvent = queryBuilder
        .search(constrant_1.excludeField)
        .filter()
        .dateRange()
        .sort()
        .fields([
        'eventName',
        'eventDate',
        'image',
        '_id',
        'isFreeEvent',
        'streetAddress',
        'EventStatus',
        'ticketSaleStart',
        'streetAddress2',
        'preSaleStart',
        'startTime',
        'eventCode'
    ])
        .paginate();
    const [meta, data] = yield Promise.all([allEvent.getMeta(), allEvent.build()]);
    return { meta, data };
});
const allUndewReview = (userID, query) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userID);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User is not Available");
    }
    const { EventStatus: status, searchTerm } = query;
    const today = new Date();
    // 🔥 Base condition (always)
    const baseFilter = {
        isDraft: false,
    };
    // 🔥 Status-based logic
    if (status) {
        baseFilter.EventStatus = status;
        // ✅ Only these need future events
        if (status === "UnderReview" || status === "Live") {
            baseFilter.eventDate = { $gte: today };
        }
        // ❌ Expired → no date condition
        if (status === "Expired") {
            delete baseFilter.eventDate;
        }
    }
    // 🔥 Search logic
    if (searchTerm) {
        baseFilter.$or = [
            { eventName: { $regex: searchTerm, $options: "i" } },
            { streetAddress: { $regex: searchTerm, $options: "i" } },
            { streetAddress2: { $regex: searchTerm, $options: "i" } },
            { eventCode: { $regex: searchTerm, $options: "i" } },
        ];
    }
    // ✔ Query
    const baseQuery = Event_model_1.Event.find(baseFilter);
    const qb = new QueryBuilder_1.QueryBuilder(baseQuery, query)
        .filter()
        .dateRange()
        .sort()
        .fields([
        "eventName",
        "eventDate",
        "image",
        "_id",
        "isFreeEvent",
        "streetAddress",
        "EventStatus",
        "ticketSaleStart",
        "streetAddress2",
        "preSaleStart",
        "startTime",
        "eventCode",
    ])
        .paginate();
    const [meta, data] = yield Promise.all([
        qb.getMeta(),
        qb.build(),
    ]);
    return { meta, data };
});
// AllGetData 💛🩷🧡💙💜🤎
const subCategory = (query) => __awaiter(void 0, void 0, void 0, function* () {
    let subCategories;
    // যদি query থাকে → category অনুসারে data আনবে
    if (query) {
        const objectId = new mongoose_1.Types.ObjectId(query);
        subCategories = yield Event_model_1.SubCategory.find({ categoryId: objectId })
            .populate("categoryId", "title coverImage ")
            .lean();
    }
    else {
        // যদি query না থাকে → সব data আনবে
        subCategories = yield Event_model_1.SubCategory.find()
            .populate("categoryId", "title coverImage categoryId")
            .lean();
    }
    // 🎯 Format করা response
    const formattedData = subCategories.map((sub) => {
        var _a, _b, _c;
        return ({
            _id: sub._id,
            categoryTitle: ((_a = sub.categoryId) === null || _a === void 0 ? void 0 : _a.title) || "N/A",
            categoryId: (_b = sub.categoryId) === null || _b === void 0 ? void 0 : _b._id,
            title: sub.title,
            coverImage: (_c = sub.categoryId) === null || _c === void 0 ? void 0 : _c.coverImage,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
        });
    });
    return formattedData;
});
const allCategory = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const { includeSelectedSubcategory } = query;
    // Load all categories
    const categories = yield Event_model_1.Category.find();
    // If includeSelectedSubcategory is not requested, return all categories as is
    if (includeSelectedSubcategory === undefined) {
        return categories;
    }
    // Load user favourites
    const favourites = yield Favourite_model_1.Favourite.find({ favouriterUserId: userId });
    // Step 1: Create a Map of favourite category and its subCategoryIds
    const favMap = new Map();
    favourites.forEach((fav) => {
        favMap.set(fav.categoryId.toString(), fav.subCategoryId.map((id) => id.toString()));
    });
    // Step 2: Process ALL categories (not just favourite ones)
    const result = yield Promise.all(categories.map((cat) => __awaiter(void 0, void 0, void 0, function* () {
        const favSubIds = favMap.get(cat._id.toString()) || [];
        // If this category has favourite subcategories, fetch and filter them
        if (favSubIds.length > 0) {
            const allSubcategories = yield Event_model_1.SubCategory.find({
                categoryId: cat._id
            });
            const filteredSubcategories = allSubcategories.filter((sub) => favSubIds.includes(sub._id.toString()));
            return Object.assign(Object.assign({}, cat.toObject()), { subCategories: filteredSubcategories });
        }
        // If no favourites for this category, return category with empty subcategories
        return Object.assign(Object.assign({}, cat.toObject()), { subCategories: [] });
    })));
    return result;
});
// Event History
const eventTicketHistory = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield Event_model_1.Event.findById(eventId);
    if (!event) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event is not Available');
    }
    const ticketHistory = event.tickets;
    return ticketHistory;
});
const barCodeCheck = (ownerId, userId, eventId, isUpdate) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User is not Available");
    }
    const event = yield Event_model_1.Event.findOne({ _id: new mongoose_1.Types.ObjectId(eventId), userId: new mongoose_1.Types.ObjectId(userId), }).select("eventName");
    if (!event) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Event is not Available for this user");
    }
    const tickets = yield ticket_model_1.TicketPurchase.find({
        ownerId: new mongoose_1.Types.ObjectId(ownerId),
        eventId: event._id,
        status: "available",
    }).select("ticketType");
    if (!tickets || tickets.length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Ticket is not Available");
    }
    if (isUpdate === "true") {
        yield ticket_model_1.TicketPurchase.updateMany({ ownerId: new mongoose_1.Types.ObjectId(ownerId), eventId: event._id, status: "available" }, { status: "used" });
    }
    const ticketCountMap = {};
    tickets.forEach((t) => {
        const type = String(t.ticketType);
        if (!ticketCountMap[type]) {
            ticketCountMap[type] = 0;
        }
        ticketCountMap[type] += 1;
    });
    const groupedData = Object.entries(ticketCountMap).map(([type, count]) => ({ type, count }));
    (0, notificatio_helper_1.sendNotifications)({
        eventId: `${event._id.toString()}`,
        eventCode: event.eventCode,
        eventStatus: event.EventStatus,
        type: 'NOTIFICATION',
        receiver: ownerId,
        read: false,
        title: "Event Participant",
        message: `Your tickets for ${event.eventName} have been verified and marked as used.`,
    }, "notification");
    return {
        eventName: event.eventName,
        data: groupedData,
    };
});
// Total Perticipent this event
const perticipentCount = (eventCode) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Find the event by code
    const event = yield Event_model_1.Event.findOne({ eventCode });
    if (!event) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event is not Available');
    }
    // 2️⃣ Get all used tickets for this event
    const tickets = yield ticket_model_1.TicketPurchase.find({ eventId: event._id, status: 'used' })
        .select('ticketType -_id'); // only need ticketType
    if (!tickets || tickets.length === 0) {
        return {
            eventName: event.eventName,
            eventCode: event.eventCode,
            used: [],
        };
    }
    // 3️⃣ Count tickets by type
    const ticketCountMap = {};
    tickets.forEach(ticket => {
        const type = String(ticket.ticketType);
        if (!ticketCountMap[type]) {
            ticketCountMap[type] = 0;
        }
        ticketCountMap[type] += 1;
    });
    // 4️⃣ Convert map to array
    const used = Object.keys(ticketCountMap).map(type => ({
        type,
        count: ticketCountMap[type],
    }));
    // 5️⃣ Return in desired format
    return {
        eventName: event.eventName,
        eventCode: event.eventCode,
        used,
    };
});
exports.EventService = {
    creteSubCategory,
    createEvent,
    updateEvent,
    updateNotification,
    creteCategory,
    allLiveEvent,
    popularEvent, //popo
    singleEvent,
    allDataUseQuery,
    closedEvent,
    updateCategory,
    deleteCategory,
    subCategory,
    allCategory,
    eventTicketHistory,
    updateSubCategory,
    allUndewReview,
    barCodeCheck,
    perticipentCount
};
