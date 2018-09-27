const express = require('express');
const fs = require ('fs');
const app = express();
const HTMLConverter = require ('./src/server/html-converter.js');


const pagesDir = './pages/';
const notFoundPage = '404.html';

app.use('/src', express.static('src'));
app.use('/node_modules', express.static('node_modules'));
app.use ('/components', express.static ('components'));

app.get('/*', function (req, res) {
    //Extract the File-Path from Request
    let filePath = req.path.substr (1, req.path.length - 1);

    let htmlConverter = new HTMLConverter (
        filePath,
        pagesDir,
        notFoundPage
    );

    htmlConverter.exportHTML ()
        .then (renderedHTML => {
            console.log ("successfully rendered:", filePath);
            res.type('text/html');
            return res.send(renderedHTML);
        })
        .catch (error => {
            console.error ("error", error);
            let notFoundContent = fs.readFileSync (pagesDir + notFoundPage, 'utf8');
            return res.send (notFoundContent);
        });
});

app.listen(process.env.PORT || 3000);
console.log('Server listeing on Port: ' + (process.env.PORT || 3000));