const routes = require('express').Router();
const app = global.app;

routes.get("/", (req, res) => {
    res.status(200).json({ message: "Connected." }).end();
});

app.pathWalk('modules/api', (filePath, rootDir, subDir, fileName) => {
    if (filePath != rootDir+'/'+fileName) {
        if (fileName == 'index.js') {
            let theseRoutes = require('./'+subDir);
            routes.use('/'+subDir, theseRoutes);
        } else {
			// console.log(filePath, rootDir, subDir, fileName);
            console.error('File not index.js found @', filePath, fileName);
        }
    }
});

module.exports = routes;
