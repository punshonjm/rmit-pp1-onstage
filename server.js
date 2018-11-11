// Require system modules
const moduleAlias = require('module-alias');
moduleAlias.addAlias("@modules", __dirname + "/modules");

const fs = require("fs");
const path = require("path");

// Require server modules & middle-ware
const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const session = require('express-session');
const csurf = require("csurf");
const compression = require('compression');
const minify = require("express-minify");
const expressSanitised = require("@modules/lib/express-sanitize-escape");

// Assign globally-used modules to variables
const configExists = fs.existsSync(`${__dirname}/config.json`);

global.config = (configExists) ? require(`${__dirname}/config.json`) : "aws" ;
const app = require("@modules/app");
const dbc = require("@modules/dbc");
const aaa = require("@modules/aaa");

// Create express.js Server
const server = express();
if ( global.config == "aws") server.enable("trust proxy", 1);

// Setup security middle-ware
server.use(helmet());
server.use(helmet.noCache());
server.use(helmet.referrerPolicy({ policy: 'same-origin' }));
server.use(helmet.contentSecurityPolicy({
	directives: {
 		defaultSrc: ["'self'"],
 		fontSrc: [ "'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://maxcdn.bootstrapcdn.com', 'https://use.fontawesome.com' ],
 		styleSrc: ["'self'", "'unsafe-inline'", 'https://maxcdn.bootstrapcdn.com', 'https://fonts.googleapis.com', 'https://use.fontawesome.com' ],
 		imgSrc: ["'self'", 'https://onstage-storage.s3.ap-southeast-2.amazonaws.com', 'https://s3-ap-southeast-2.amazonaws.com'],
		scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "data:"]
 	}
}));

server.disable('x-powered-by');
server.use(compression());
server.use(minify());

// Serve static, public content
server.use("/public", express.static(path.join(__dirname, "www/public")));

// Setup standard middle-ware
var cookieSettings = {
	httpOnly: true,
	sameSite: true,
	secure: (global.config == "aws") ? true : false
};

server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ "extended": true }));
server.use(session({
	secret: "thisStagePassSecret",
	cookie: cookieSettings,
	resave: false,
	saveUninitialized: false
}));
server.use(csurf({ cookie: cookieSettings }));
server.use(expressSanitised.middleware());

// Setup session management middle-ware
server.use(aaa.sessionManagement);

const router = require("@modules/router");
server.use("/", router);

let port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log("Performing 'On Stage'...");
    console.log("The action is happening on Stage #" + port);
});

const mr = require('@modules/mailReader').initialise();
const notify = require('@modules/notifications').initialise();
