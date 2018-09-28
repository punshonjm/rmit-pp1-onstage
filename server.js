// Require system modules
const fs = require("fs");
const path = require("path");

// Require server modules & middle-ware
const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');

// Assign globally-used modules to variables
const configExists = fs.existsSync(`${__dirname}/config.json`);

global.config = (configExists) ? require(`${__dirname}/config.json`) : "aws" ;
global.app = require(`${__dirname}/modules/app`);
global.dbc = require(`${__dirname}/modules/dbc`);
global.aaa = require(`${__dirname}/modules/aaa`);

// Create express.js Server
const server = express();
server.enable("trust proxy");

// Setup standard middle-ware
server.use(helmet());
server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ "extended": true }));

// Serve static, public content
server.use("/public", express.static(path.join(__dirname, "www/public")));

// Setup session management middle-ware
server.use(aaa.sessionManagement);

// Server static, non-public content
server.use("/assets", express.static(path.join(__dirname, "www/assets")));

const router = require(`${__dirname}/modules/router`);
server.use("/", router);

let port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log("Performing 'On Stage'...");
    console.log("The action is happening on Stage #" + port);
});
