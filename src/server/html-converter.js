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

    //TODO: Rehydration-Method makes, that nested elements get's attatched multiple times and therefore the connectedCallback get's called multiple times!!!
    //TODO: It's because of the order from inner to outer, the inner get's reattatched
    static _addRehydrationScripts (htmlContent, componentNames) {
        let script = htmlContent.window.document.createElement ('script');
        script.setAttribute ('async', 'true');
        script.setAttribute ('importance', 'high');

        script.innerHTML = `
            function copyElementAttributes (element, newElement) {
                // Grab all of the original's attributes, and pass them to the replacement
                for(let n = 0, l = element.attributes.length; n < l; ++n){
                    if (element.attributes.item(n).nodeName !== "data-component") {
                        var nodeName  = element.attributes.item(n).nodeName;
                        var nodeValue = element.attributes.item(n).nodeValue;
                        newElement.setAttribute(nodeName, nodeValue);
                    }
                }
            }
        
            function replaceTagName (element, newTagName, tagNames, replacements) {
                if (element === null || typeof element === "undefined") return;
            
                //Create New Custom Element
                let replacement = document.createElement (newTagName);
            
                //Copy the Attributes
                copyElementAttributes (element, replacement);
                
                //Replace All Child-Node Custom Elements
                let replacementContent = element.lastElementChild;
                replaceTagNames (replacementContent, newTagName, tagNames, replacements);
                
                //TODO: Replace Div with Template-Tag
                //Replace Content (Set innerHTML to Template-Element innerHTML)
                //replacement.innerHTML = replacementContent.innerHTML; 
                while (replacementContent.childNodes.length > 0) {
                    replacement.appendChild(replacementContent.childNodes [0]);
                }
                
                // Replace Element in Dom with new One
                replacements.push ({
                    element: element,
                    replacement: replacement
                });
                //element.parentNode.replaceChild(replacement, element);
            }
            
            function replaceTagNames (element, newTagName, tagNames, replacements) {
                let componentElement = element.querySelector('[data-component=' + newTagName + ']')
                replaceTagName (componentElement, newTagName, tagNames, replacements);
            }
            
            document.addEventListener("DOMContentLoaded", () => {
                let components = ${JSON.stringify (componentNames)};
                let replacements = [];
                components.forEach (component => {
                    replaceTagNames (window.document, component, components, replacements);
                });
                
                for (let i = replacements.length - 1; i >= 0; i--) {
                    replacements[i].element.parentNode.replaceChild(replacements[i].replacement, replacements[i].element);
                }
            });
        `;

        htmlContent.window.document.body.appendChild (script);
    }

    static async _replaceComponentTags (htmlContent, componentName) {
        //1. Extract all Component-Tags
        let componentTags = htmlContent.window.document.getElementsByTagName (componentName);
        for (let n = componentTags.length - 1; n >= 0; n--) {
            let componentTag = componentTags [n];
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