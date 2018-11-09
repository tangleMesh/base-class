const fs = require ("fs");
const Configuration = require ('../../config.json');

class PathMelioratorMiddleware {

    static MelioratePath (req, res, next) {
        //Extract the File-Path from Request
        req.filePath = PathMelioratorMiddleware._Meliorate (req.path.substr (1, req.path.length - 1));
        return next ();
    }

    static _Meliorate (filePath) {
        //Set Index-Page when no path existing
        if (typeof filePath === "undefined" || filePath.length <= 0)
            return "index.html";

        //If no file-Ending exists and folder or file doesn't exist and file with ending exists add .html to file-path
        if (filePath.substr (-5) === ".html") {
            return filePath;
        }

        const fullFilePath = Configuration.application.pagesDirectory + '/' + filePath;
        //if file does not exist, just add extension .html
        if (!fs.existsSync(fullFilePath) && filePath.substr (-1) !== '/') {
            return filePath + '.html';
        }

        //If folder, just add .html extension
        if (fs.lstatSync(fullFilePath).isDirectory()) {
            return filePath + (filePath.substr (-1) === '/' ? '' : '/') + 'index.html';
        }

        //If no Folder and File does exist, just return
        return filePath;
    }

}

module.exports = PathMelioratorMiddleware;