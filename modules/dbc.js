const MySQL = require("mysql");
const Squel = require("squel");
const Moment = require("moment");

var dbc = {};

dbc.mysql = MySQL;
dbc.sql = Squel;

dbc.pool = MySQL.createPool({
    connectionLimit: 10,
    host: global.config.database.hostname,
    user: global.config.database.username,
    password: global.config.database.password,
    database: "BBALL_STATS",
    dateString: true,
});
dbc.execute = function(query) {
    return new Promise(function(resolve, reject) {
        dbc.pool.getConnection((error, connection) => {
            if (error) {
                reject({ "error": error, "note": "MySQL Connection Error" });
            } else {
                if (!('text' in query) && !('values' in query)) {
                    query = query.toParam();
                }

                connection.query(query.text, query.values, (error, rows) => {
                    connection.release();
                    if (error) {
                        reject({ "error": error, "note": "MySQL Query Error" });
                    } else {
                        resolve(rows);
                    }
                });
            }
        });
    });
};
dbc.getRow = function(query) {
    return new Promise(function(resolve, reject) {
        dbc.pool.getConnection((error, connection) => {
            if (error) {
                reject({ "error": error, "note": "MySQL Connection Error" });
            } else {
                if (!('text' in query) && !('values' in query)) {
                    query = query.toParam();
                }

                connection.query(query.text, query.values, (error, rows) => {
                    connection.release();
                    if (error) {
                        reject({ "error": error, "note": "MySQL Query Error" });
                    } else {
                        resolve((typeof rows[0] === typeof undefined) ? false : rows[0]);
                    }
                });
            }
        });
    });
};

dbc.sql.date = function(column, format = 'DD/MM/YYYY') {
    return Moment(column, 'YYYY-MM-DD').format(format);
};
dbc.sql.dateTime = function(column, format = 'DD/MM/YYYY h:mm a') {
    return Moment(column, 'YYYY-MM-DD HH:mm:ss').format(format);
};

module.exports = dbc;

if (!String.isNullOrEmpty) {
    Object.defineProperty(String, 'isNullOrEmpty', {
        value: function(val) {
            return !(typeof value === 'string' && value.length > 0);
        },
        enumerable: false,
    });
}
