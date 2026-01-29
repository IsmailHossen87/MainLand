"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
// ASCII Art Title
(0, figlet_1.default)('OOAAOW', (err, data) => {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    // Print the title with color
    console.log(chalk_1.default.green(data));
    // Print version info and system details with color
    console.log(chalk_1.default.cyan('VERSION INFO:'));
    console.log(chalk_1.default.yellow('Template: 1.0'));
    console.log(chalk_1.default.magenta('Node.js: v20.11.1'));
    console.log(chalk_1.default.blue('OS: ubuntu'));
});
