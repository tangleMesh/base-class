const fs = require ("fs");
const requireFromString = require ('require-from-string');

class ComponentRenderer {

    constructor (componentName, componentAttributes, componentContent = '', componentDir = './components/') {
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

        content = 'let BaseElement = require (\'../src/ssr-base-element.js\');' + content + 'module.exports = ' + this._componentNameCamelCase + ';';


        //console.log(content);
        const ComponentElement = requireFromString (content, this._componentsDir + this._componentName + '.js');

        return new ComponentElement ();
    }

    async componentHTML () {

        let attributes = "";
        for (let key in this._componentElement.attributes) {
            attributes += " " + key + "=\"" + this._componentElement [key] + "\"";
        }

        return `
            <div 
                data-component ="${this._componentName}"
                ${attributes}
            >` + await this._componentElement.render () + `
                <div style="visibility: hidden;position: absolute;top: -9999px; display: none; opacity: 0; height: 0; width: 0; z-index: -1;" data-component-content="${this._componentName}">${this._componentContent}</div>
            </div>
        `;
    }

}

module.exports = ComponentRenderer;