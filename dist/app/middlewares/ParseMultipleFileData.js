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
exports.parseMultipleFilesdata = void 0;
const getFilePath_1 = require("../../shared/getFilePath");
const parseMultipleFilesdata = (fieldName) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const file = (0, getFilePath_1.getMultipleFilesPath)(req.files, fieldName);
            if (req.body.data) {
                const data = JSON.parse(req.body.data);
                req.body = Object.assign(Object.assign({}, data), { [fieldName]: file });
            }
            else {
                req.body = Object.assign(Object.assign({}, req.body), { [fieldName]: file });
            }
            next();
        }
        catch (error) {
            next(error);
        }
    });
};
exports.parseMultipleFilesdata = parseMultipleFilesdata;
