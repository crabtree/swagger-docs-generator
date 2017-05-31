"use strict";
const path = require("path");
const {Parser, Generator} = require("../lib/index");

if (process.argv.length !== 3) {
    console.error(`Invalid usage. Try: node ${path.basename(process.argv[1])} <api docs json file, eg. api_docs.json>`);
    process.exit();
}

const apiDocsJsonPath = path.resolve(process.cwd(), process.argv[2]);

const sp = Parser.fromFile(apiDocsJsonPath);
sp.parseEndpoints();

const sg = Generator.fromParser(sp);
sg.toOutputFileAsync()
     .then(() => process.exit());