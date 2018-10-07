# RMIT_CPT331_PP1 "On Stage"
- Clone repository into directory
- Run "npm install" to install dependencies
- Run "node server.js" to start application or run with a package like nodemon or forever
- Create a config.json with the database connection configuration, if no configuration file is provided the app with attempt to connect to an AWS RDS prsent in the process variables 

# Continuos Integration - Circle Ci
Build Status: [![CircleCI](https://circleci.com/gh/punshonjm/RMIT_CPT331_PP1.svg?style=svg&circle-token=6721d5a1c84adcb1f2259e26a2143ea0bc0b5fdf)](https://circleci.com/gh/punshonjm/RMIT_CPT331_PP1)

# Example of config.json
{
    "database": {
        "hostname": "localhost",
        "username": "user",
        "password": "pass"
    }
}
