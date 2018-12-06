const express = require('express');
const compression = require('compression')
const fs = require ('fs');
const HTMLConverter = require ('./scripts/server/html-converter');
const WebTokenMiddleware = require ('./scripts/server/web-token.middleware');
const PathMelioratorMiddleware = require ('./scripts/server/path-meliorator.middleware');
const Configuration = require ('./config.json');

//Create Express app
const app = express();

//Minify in Production
if (Configuration.application.production) {
    app.use(compression ());
    //TODO: Add Minifying
}

//Make needed Modules and Files Static
app.use('/scripts/base-element.js', express.static('scripts/base-element.js'));
app.use('/node_modules/lit-html', express.static('node_modules/lit-html'));
app.use ('/' + Configuration.application.componentsDirectory, express.static (Configuration.application.componentsDirectory));
//Make the Asset-Folders static
Configuration.application.assetDirectories.forEach ((assetFolder) => {
    app.use ('/' + assetFolder, express.static (assetFolder));
});


//Render Static Pages, defined in the `pagesDirectory`
app.get('/*', PathMelioratorMiddleware.MelioratePath, (req, res) => {
    //Read the filePath
    let filePath = req.filePath;

    let htmlConverter = new HTMLConverter (
        filePath
    );

    htmlConverter.exportHTML ()
        .then (renderedHTML => {
            res.type('text/html');
            return res.status (200).send (renderedHTML);
        })
        .catch (error => {
            console.error ("Error:", error);
            let notFoundContent = fs.readFileSync (Configuration.application.pagesDirectory + '/' + Configuration.application.errorPage, 'utf8');
            return res.status (404).send (notFoundContent);
        });
});

//Render Dynamic Pages with API
app.post('/*', WebTokenMiddleware.WebToken, async (req, res) => {

    //Read the Raw HTML-File from Request
    let template = '';
    req.on('data', chunk => {
        template += chunk.toString(); // convert Buffer to string
    });
    await req.on('end', () => {});


    let htmlConverter = new HTMLConverter (
        template,
        null
    );

    htmlConverter.exportHTML ()
        .then (renderedHTML => {
            res.type('text/html');
            return res.status (200).send (renderedHTML);
        })
        .catch (error => {
            console.error ("Error:", error);
            return res.status (400).send ("Error rendering received template!");
        });
});

app.listen(process.env.PORT || 3000);
console.log('Server listening on Port: ' + (process.env.PORT || 3000));