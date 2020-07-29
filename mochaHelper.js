// Require system modules
const moduleAlias = require('module-alias');
moduleAlias.addAlias("@modules", __dirname + "/modules");

const fs = require("fs");
const configExists = fs.existsSync(`${__dirname}/config.json`);
global.config = (configExists) ? require(`./config.json`) : "aws" ;

let dbc = require("./modules/dbc.js")

global.dbc = dbc;
global.app = require("./modules/app");
