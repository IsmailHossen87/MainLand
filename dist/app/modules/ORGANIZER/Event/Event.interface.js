"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IEventStatus = exports.TicketType = void 0;
var TicketType;
(function (TicketType) {
    TicketType["PREMIUM"] = "Premium";
    TicketType["VIP"] = "VIP";
    TicketType["STANDARD"] = "Standard";
    TicketType["OTHER"] = "Other";
})(TicketType || (exports.TicketType = TicketType = {}));
var IEventStatus;
(function (IEventStatus) {
    IEventStatus["Live"] = "Live";
    IEventStatus["UnderReview"] = "UnderReview";
    IEventStatus["Closed"] = "Closed";
    IEventStatus["Sold"] = "Sold";
    IEventStatus["Expired"] = "Expired";
    IEventStatus["Upcoming"] = "Upcoming";
    IEventStatus["Used"] = "Used";
    IEventStatus["Available"] = "Available";
    IEventStatus["Draft"] = "Draft";
    IEventStatus["Rejected"] = "Rejected";
})(IEventStatus || (exports.IEventStatus = IEventStatus = {}));
