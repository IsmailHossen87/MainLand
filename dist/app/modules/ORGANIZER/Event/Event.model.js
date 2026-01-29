"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = exports.Category = exports.SubCategory = void 0;
const mongoose_1 = require("mongoose");
const Event_interface_1 = require("./Event.interface");
const SubCategorySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true },
    title: { type: String, default: "", required: true, trim: true },
}, { timestamps: true, versionKey: false });
// 🟦 Category Schema
const CategorySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Types.ObjectId, ref: 'User', required: true },
    title: {
        type: String, default: "",
        trim: true,
    },
    coverImage: {
        type: String, default: "",
    },
}, { timestamps: true, versionKey: false });
// 🟩 Event Schema
const EventSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    eventName: { type: String, required: true, default: "", trim: true },
    image: { type: String, default: "" },
    category: [
        {
            categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category", required: false },
            subCategory: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "SubCategory" }],
        },
    ],
    tags: [{ type: String, default: "", trim: true }],
    description: { type: String, default: "" },
    eventDate: { type: Date, default: null },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    streetAddress: { type: String, default: "" },
    streetAddress2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    EventStatus: { type: String, enum: Object.values(Event_interface_1.IEventStatus), default: Event_interface_1.IEventStatus.Draft },
    notification: { type: String, default: "" },
    notificationStatus: { type: String, enum: ["idle", "pending", "success", "rejected"], default: "idle" },
    payoutStatus: { type: String, enum: ['pending', 'processing', 'completed'], default: 'pending' },
    payoutDate: { type: Date, default: null },
    eventCode: { type: String, default: "" },
    tickets: [
        {
            type: {
                type: String,
                enum: Object.values(Event_interface_1.TicketType),
                required: true,
                default: Event_interface_1.TicketType.OTHER,
            },
            price: { type: Number, required: true },
            availableUnits: { type: Number, required: true },
            outstandingUnits: { type: Number },
            earnedAmount: { type: Number, default: 0 },
            ticketBuyerId: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "TicketPurchase" }],
        },
    ],
    ticketSaleStart: { type: Date, default: null },
    preSaleStart: { type: Date, default: null },
    preSaleEnd: { type: Date, default: null },
    isFreeEvent: { type: Boolean, default: false },
    discountCodes: [
        {
            code: { type: String, default: "", trim: true },
            percentage: { type: Number, min: 0, max: 100 },
            expireDate: { type: Date }
        },
    ],
    organizerName: { type: String, default: "" },
    organizerEmail: { type: String, default: "" },
    organizerPhone: { type: String, default: "" },
    locationName: { type: String, default: "" },
    totalEarned: { type: Number, default: 0 },
    totalReview: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Review" }],
    isDraft: { type: Boolean, default: true },
    payoutEligibleDate: {
        type: Date
    },
}, {
    timestamps: true,
    versionKey: false,
});
EventSchema.pre('save', function (next) {
    if (this.eventDate && !this.payoutEligibleDate) {
        // Event শেষ হওয়ার 14 দিন পর payout eligible
        const eligibleDate = new Date(this.eventDate);
        eligibleDate.setDate(eligibleDate.getDate() + 15);
        this.payoutEligibleDate = eligibleDate;
    }
    next();
});
// 🧩 Export Models
exports.SubCategory = (0, mongoose_1.model)('SubCategory', SubCategorySchema);
exports.Category = (0, mongoose_1.model)('Category', CategorySchema);
exports.Event = (0, mongoose_1.model)('Event', EventSchema);
