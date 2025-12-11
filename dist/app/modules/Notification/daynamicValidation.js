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
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicNotifaicationValidation = void 0;
const notification_validation_1 = require("./notification.validation");
const dynamicNotifaicationValidation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';
        let schema;
        if (isDraft) {
            schema = notification_validation_1.NotificationValidation.DraftNotificationZodSchema;
        }
        else {
            schema = notification_validation_1.NotificationValidation.FullNotificationZodSchema;
        }
        yield schema.parseAsync({
            body: req.body,
        });
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.dynamicNotifaicationValidation = dynamicNotifaicationValidation;
