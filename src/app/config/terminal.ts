import chalk from "chalk";
import nodeFiglet from "figlet";

// ASCII Art Title
nodeFiglet('OOAAOW', (err, data) => {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }

    // Print the title with color
    console.log(chalk.green(data));

    // Print version info and system details with color
    console.log(chalk.cyan('VERSION INFO:'));
    console.log(chalk.yellow('Template: 1.0'));
    console.log(chalk.magenta('Node.js: v20.11.1'));
    console.log(chalk.blue('OS: ubuntu'));
});