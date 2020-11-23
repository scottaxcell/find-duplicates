const fs = require("fs");
const { ArgumentParser } = require("argparse");
const { version } = require("./package.json");
const dateFormat = require("dateformat");
const find = require("find");
const md5File = require("md5-file");

function logInfo(msg) {
	console.log(`${dateFormat(new Date())} INFO ${msg}`);
}

function logError(msg) {
	console.error(`${dateFormat(new Date())} ERROR ${msg}`);
}

const parser = new ArgumentParser({
	description: "Finds and prints duplicate files to standard out",
});

parser.add_argument("-v", "--version", { action: "version", version });
parser.add_argument("-d", "--directory", {
	help: "Directory to search for duplcates",
});

const args = parser.parse_args();
const directory = args.directory;
if (!directory) {
	logError("directory argument is required\n");
	parser.print_help();
	process.exit(1);
}

try {
	if (!fs.existsSync(directory)) {
		logError(`directory ${directory} does not exist`);
		process.exit(1);
	}
} catch (e) {
	console.error(`An error occurred. ${e}`);
	process.exit(1);
}

logInfo(`searching ${directory} for files ...`);

const files = find.fileSync(directory);
if (!files || files.length <= 0) {
	logInfo(`no files found`);
	process.exit(0);
}

logInfo(`processing ${files.length} files for duplicates ...`);

const hashMap = {};
files.forEach((file) => {
	const hash = md5File.sync(file);
	if (hashMap[hash]) {
		hashMap[hash].push(file);
	} else {
		hashMap[hash] = [file];
	}
});

let numDuplicates = 0;
for (const [hash, files] of Object.entries(hashMap)) {
	if (files.length > 1) {
		numDuplicates++;
		let msg = `duplicate found [${hash}] (${files.length}):\n`;
		files.forEach((file) => {
			msg += `${file}\n`;
		});
		logInfo(msg);
	}
}

logInfo(
	numDuplicates > 0
		? `found ${numDuplicates} instances duplicates`
		: "no duplicates found"
);
