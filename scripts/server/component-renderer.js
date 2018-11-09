const fs = require ("fs");
const requireFromString = require ('require-from-string');
const Configuration = require ('../../config.json');

class ComponentRenderer {

    constructor (componentName, componentAttributes, componentContent = '', componentDir = Configuration.application.componentsDirectory + '/') {
        this._componentName = componentName;
        this._componentAttributes = componentAttributes;
        this._componentContent = componentContent;
        this._componentNameCamelCase = this._componentName.toLowerCase()
            .split(/[\s-]/)
            .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
            .join('');
        this._componentsDir = componentDir;
        this._componentElement = this._createComponentElement ();
    }

    _createComponentElement () {
        let content = fs.readFileSync (this._componentsDir + this._componentName + '.js', 'utf8');
        let match = content.match (/^(((?!import\s+BaseElement).)*)$/igm);
        content = match.join ('\n');
        match = content.match (/^(((?!window\.customElements).)*)$/igm);
        content = match.join ('\n');

        let extension = '';
        for (let i = 0; i < Configuration.application.componentsDirectory.split ('/').length; i++) {
            extension += '../';
        }
        content = 'let BaseElement = require (\''+ extension + 'scripts/ssr-base-element.js\');' + content + 'module.exports = ' + this._componentNameCamelCase + ';';


        //Replace Slots with surrounding span data-component-slot="slotName"
        //content = content.replace (/<slot((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>(.*)<\/slot>/igm, (match, $1, $2, $3, $4) => {
        //TODO: Replace Slot with surrounding span data-component-slot="slotName" to only set slot-content to innerHTML of custom element in Rehydration!
        content = content.replace (/<slot(name=")(.*)(\")><\/slot>/igm, (match, $1, $2, $3, $4) => {
            console.log(match, $1, $2, $3, $4);
            return `<slot ${ $1 }>${$1}</slot>`;
        }); //"<span data-component-slot=\"$1\"><slot name=\"$1\">$2</slot></span>");


        //console.log(content);
        const ComponentElement = requireFromString (content, this._componentsDir + this._componentName + '.js');

        return new ComponentElement (this._componentAttributes);
    }

    async componentHTML () {

        //Append Component Attributes
        let attributes = "";
        for (let key in this._componentElement.attributes) {
            attributes += " " + key + "='" + JSON.stringify (this._componentElement [key]) + "'";
        }

        //Append Other Attributes
        for (let key in this._componentAttributes) {
            if (!(key in this._componentElement.attributes)) {
                attributes += " " + key + "=\"" + this._componentAttributes [key] + "\"";
            }
        }

        //TODO: Replace Div with Template-Tag
        return `
            <span 
                data-component ="${this._componentName}"
                ${attributes}
            >` + await this._componentElement.render () + `
                <div style="visibility: hidden;position: absolute;top: -9999px; display: none; opacity: 0; height: 0; width: 0; z-index: -1;" data-component-content="${this._componentName}">${this._componentContent}</div>
            </span>
        `;
        //<div style="visibility: hidden;position: absolute;top: -9999px; display: none; opacity: 0; height: 0; width: 0; z-index: -1;" data-component-content="${this._componentName}">${this._componentContent}</div>
    }

}

module.exports = ComponentRenderer;