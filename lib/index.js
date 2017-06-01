"use strict";

const Promise = require("bluebird");
const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const debug = require("debug")("swagger-docs-generator");

const OUTPUT_FILE_NAME = "swagger.json";

const YML_EXTENSION = ".yml";
const JSON_EXTENSION = ".json";

class Parser {
    static fromFile (jsonPath) {
        debug(`Parsing json file ${jsonPath}`);

        const o = fs.readJsonSync(jsonPath);
        return new Parser(o, path.dirname(jsonPath));
    }

    constructor (opts, rootPath) {
        this._rootPath = rootPath;
        this.outputFile = opts.outputFile || OUTPUT_FILE_NAME;
        this.swaggerInfo = opts.info;
        this.swaggerOpts = opts.opts || {};
        this.swaggerEndpoints = {};

        this._endpoints = opts.endpoints || {};
    }

    parseEndpoints () {
        this.swaggerEndpoints = {};
        this.swaggerOpts["definitions"] = this.swaggerOpts["definitions"] || {};

        this._endpoints.forEach((endpointPath) => {
            debug(`Parsing endpoints declaration from ${endpointPath}`);

            const ext = path.extname(endpointPath);
            const fullPath = path.resolve(this._rootPath, endpointPath);
            
            switch(ext) {
                case YML_EXTENSION:
                    this._parseYml(fullPath);
                    break;
                case JSON_EXTENSION:
                    this._parseJson(fullPath);
                    break;
                default:
                    throw new Error(`Unsupported endpoints declaration file format: ${ext}`);
            }
        });
    }

    _parseYml (endpointPath) {
        const endpointDoc = yaml.safeLoad(fs.readFileSync(endpointPath));
        this._mergeEndpointsDocs(endpointDoc);
    }

    _parseJson (endpointPath) {
        const endpointDoc = JSON.parse(fs.readFileSync(endpointPath));
        this._mergeEndpointsDocs(endpointDoc);
    }

    _mergeEndpointsDocs (endpointDoc) {
        Object.assign(this.swaggerEndpoints, endpointDoc.paths || {});
        Object.assign(this.swaggerOpts.definitions, endpointDoc.definitions || {});
    }
}

class Generator {
    static fromParser (parser) {
        return new Generator(parser.swaggerInfo, parser.swaggerEndpoints, parser.swaggerOpts);
    }

    constructor (info, endpoints, opts) {
        this._outputFileName = OUTPUT_FILE_NAME;
        this._swagger = new Swagger_2(info, opts)
            .withEndpoints(endpoints);
    }

    toSwaggerJsonAsync () {
        return Promise.resolve(this._swagger);
    }

    toOutputFileAsync () {
        return this.toSwaggerJsonAsync()
            .then((o) => fs.writeJson(this._outputFileName, o));
    }
}

class Swagger_2 {
    constructor (info, opts) {
        this.swagger = "2.0";
        this.info = info;
        this.paths = {};

        ["host"
        , "basePath"
        , "schemes"
        , "consumes"
        , "produces"
        , "definitions"
        , "parameters"
        , "responses"
        , "securityDefinitions"
        , "security"
        , "tags"
        , "externalDocs"].forEach((prop) => {
            if (opts[prop]) {
                this[prop] = opts[prop];
            }
        });
    }

    withEndpoints(endpoints) {
        this.paths = endpoints;
        return this;
    }
}

class Swagger_2_Info {
    constructor (title, version, opts) {
        this.title = title;

        ["description"
        , "termsOfService"
        , "contact"
        , "license"].forEach((prop) => {
            if (opts[prop]) {
                this[prop] = opts[prop];
            }
        })
    }
}

module.exports = {
    Parser
    , Generator
    , Swagger_2
    , Swagger_2_Info
}