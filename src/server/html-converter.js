const fs = require ("fs");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const ComponentRenderer = require ("./component-renderer.js");

class HTMLConverter {

    constructor (filePath = '404.html', pagesDir = './pages/', errorPage = '404.html') {
        this._filePath = filePath;
        this._pagesDir = pagesDir;
        this._errorPage = errorPage;
    }

    exportHTML () {
        return new Promise ((resolve, reject) => {
            let htmlContent = this._readHTMLFile ();

            let componentNames = HTMLConverter._extractUsedComponentNames (htmlContent);

            let renderTagsPromises = [];

            componentNames.forEach (componentName => {
                renderTagsPromises.push (HTMLConverter._replaceComponentTags (htmlContent, componentName));
            });

            HTMLConverter._addRehydrationScripts (htmlContent, componentNames);


            Promise.all (renderTagsPromises)
                .then (results => {
                    return resolve (htmlContent.serialize ());
                })
                .catch (error => {
                    return reject(error);
                });
        });
    }

    static _addRehydrationScripts (htmlContent, componentNames) {
        let script = htmlContent.window.document.createElement ('script');
        script.setAttribute ('async', 'true');
        script.setAttribute ('importance', 'high');


        //TODO: Nested Elements does not work correctly! Only the most inner element get's rendered!
        script.innerHTML = `
            function replaceTagNames (newTagName) {
                let elements = document.querySelectorAll('[data-component=' + newTagName + ']');
                
                for (let i = elements.length - 1; i >= 0; i--) {
                    let element = elements [i];               
                    let replacement = document.createElement (newTagName);
                    
                    // Grab all of the original's attributes, and pass them to the replacement
                    for(let n = 0, l = element.attributes.length; n < l; ++n){
                        if (element.attributes.item(n).nodeName !== "data-component") {
                            var nodeName  = element.attributes.item(n).nodeName;
                            var nodeValue = element.attributes.item(n).nodeValue;
                            replacement.setAttribute(nodeName, nodeValue);
                        }
                    }
                    
                    // Input content
                    let slotContent = element.querySelector('[data-component-content=' + newTagName + ']')
                    replacement.innerHTML = slotContent.innerHTML;
                    
                    // Switch!
                    element.parentNode.replaceChild(replacement, element);
                }
            }
            
            document.addEventListener("DOMContentLoaded", () => {
                let components = ${JSON.stringify (componentNames)};
                components.forEach (component => {
                    replaceTagNames (component);
                });
            });
        `;

        htmlContent.window.document.body.appendChild (script);
    }

    static async _replaceComponentTags (htmlContent, componentName) {
        //1. Extract all Component-Tags
        let componentTags = htmlContent.window.document.getElementsByTagName (componentName);

        while (componentTags.length >= 1) {
            let componentTag = componentTags [0];
            let content = componentTag.innerHTML;

            //2. Extract all Attributes of this Tag
            let componentAttributes = [];
            for (let i = 0; i < componentTag.attributes.length; i++) {
                let attribute = componentTag.attributes [i];
                componentAttributes [attribute.name] = attribute.value;
            }


            //3. Create new ComponentElement with Attributes
            let componentRenderer = new ComponentRenderer (componentName, componentAttributes, content);


            //4. Render Template
            let template = await componentRenderer.componentHTML ();
            let templateDiv = new JSDOM (template);


            //5. Replace Slots by Content
            let slots = templateDiv.window.document.body.firstChild.getElementsByTagName ('slot');
            Array.from (slots).forEach (slot => {
                slot.outerHTML = content;
            });


            //6. Replace Component-Tag
            componentTag.parentNode.replaceChild (templateDiv.window.document.body.firstChild, componentTag);
        }

        return componentTags;
    }

    static _extractUsedComponentNames (htmlContent) {
        let scriptTags = htmlContent.window.document.getElementsByTagName ('script');

        let components = [];

        for (let i = 0; i < scriptTags.length; i++) {
            let scriptTag = scriptTags [i];

            if (!scriptTag.hasAttribute ('type') || scriptTag.getAttribute ('type').toLowerCase () !== "module" || !scriptTag.hasAttribute ('src'))
                continue;

            let srcAttr = scriptTag.getAttribute ('src');
            let regexComponentName = /[\s\S]*['\"/](.*)\.js/im;

            let componentName = regexComponentName.exec (srcAttr);
            if (componentName !== null && componentName.length >= 2)
                components.push (componentName [1]);
        }

        return components;
    }

    _readHTMLFile () {
        let errorPath = this._pagesDir + this._errorPage;
        let filePath = this._pagesDir + this._filePath;
        if (!fs.existsSync(filePath))
            filePath = errorPath;

        let htmlContent = fs.readFileSync(filePath, 'utf8');
        return new JSDOM(htmlContent);
    }

}

module.exports = HTMLConverter;