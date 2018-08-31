// Require system modules
const fs = require("fs");
const path = require("path");

// Require server modules & middle-ware
const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');

const moment = require("moment");

// Assign globally-used modules to variables
global.config = require(`${__dirname}/config.json`);
global.dbc = require(`${__dirname}/modules/dbc`);

// Create express.js Server
const server = express();

// Setup middle-ware
server.use(helmet());
server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ "extended": true }));

// Serve static, public content
server.use("/public", express.static(path.join(__dirname, "www/public")));


// Server static, non-public content
server.use("/assets", express.static(path.join(__dirname, "www/assets")));

server.listen(3000, () => {
	console.log("Performing 'On Stage'...");
});
