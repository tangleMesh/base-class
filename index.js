const express = require('express');
const fs = require ('fs');
const app = express();
const HTMLConverter = require ('./src/server/html-converter');
const WebTokenMiddleware = require ('./src/server/web-token.middleware');


const pagesDir = './pages/';
const notFoundPage = '404.html';

app.use('/src', express.static('src'));
app.use('/node_modules', express.static('node_modules'));
app.use ('/components', express.static ('components'));

//Render Static Pages, defined in the `pagesDirectory`
app.get('/*', (req, res) => {
    //Extract the File-Path from Request
    let filePath = req.path.substr (1, req.path.length - 1);

    let htmlConverter = new HTMLConverter (
        filePath,
        pagesDir,
        notFoundPage
    );

    htmlConverter.exportHTML ()
        .then (renderedHTML => {
            res.type('text/html');
            return res.status (200).send (renderedHTML);
        })
        .catch (error => {
            console.error ("Error:", error);
            let notFoundContent = fs.readFileSync (pagesDir + notFoundPage, 'utf8');
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
        null,
        notFoundPage
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
console.log('Server listeing on Port: ' + (process.env.PORT || 3000));