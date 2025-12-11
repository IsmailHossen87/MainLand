"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// const unlinkFile = (file: string) => {
//   const filePath = path.join('uploads', file);
//   if (fs.existsSync(filePath)) {
//     fs.unlinkSync(filePath);
//   }
// };
const unlinkFile = (filePathFromDB) => {
    if (!filePathFromDB)
        return;
    const fileName = filePathFromDB.replace("/image/", "");
    // এবার uploads ফোল্ডারে ফাইলটা কোথায় আছে তার path বানানো হচ্ছে
    const fullPath = path_1.default.join("uploads", fileName);
    if (fs_1.default.existsSync(fullPath)) {
        fs_1.default.unlinkSync(fullPath);
    }
};
exports.default = unlinkFile;
