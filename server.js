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
const configExists = fs.existsSync(`${__dirname}/config.json`);

global.config = (configExists) ? require(`${__dirname}/config.json`) : "aws" ;
global.app = require(`${__dirname}/modules/app`);
global.dbc = require(`${__dirname}/modules/dbc`);
global.aaa = require(`${__dirname}/modules/aaa`);

// Create express.js Server
const server = express();

// Setup middle-ware
server.use(helmet());
server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ "extended": true }));

// Serve static, public content
server.use("/public", express.static(path.join(__dirname, "www/public")));

server.use(aaa.sessionManagement);

// Server static, non-public content
server.use("/assets", express.static(path.join(__dirname, "www/assets")));

const router = require(`${__dirname}/modules/router`);
server.use("/", router);

let port = process.env.PORT || 3000;

if ( configExists ) {
	server.listen(port, () => {
		console.log("Performing 'On Stage'...");
		console.log("The action is happening on Stage #" + port);
	});
} else {
	// Initialise express server with SSL/TLS
	require("greenlock-express").create({
	    version: "draft-11",
	    configDir: "~/.config/acme/",
	    server: "staging",
	    email: "s3671009@student.rmit.edu.au",
	    agreeTos: true, debug: false,
	    approveDomains: [ "onstage.octbox.com" ],
	    app: server,
	}).listen( port );
}
