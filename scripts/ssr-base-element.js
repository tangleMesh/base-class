const { html, render } = require ('@popeindustries/lit-html-server');
const repeat = require ('@popeindustries/lit-html-server/directives/repeat.js');

class SSRBaseElement {

    get template () {
        return this.Template`<slot></slot>`;
    }

    get attributes () {
        return {};
    }

    get isServer () {
        return this._isServer;
    }

    //Before native HTMLElement gets created
    beforeCreated () {}

    //Element has been created and a shadow-dom has been attatched
    created () {}

    //Just before the Server creates the html
    serverInit () {}



    constructor (attributes = {}) {
        //Create Getter and Setter
        this._createGetterAndSetter ();
        //Set is-Server variable
        this._isServer = true;

        //Set the HTML-Tag Attributes
        this._setAttributes (attributes);

        //Call the different lifecycle-methods
        this.beforeCreated ();
        this.created ();
        this.serverInit ();
    }

    get Template () {
        return html;
    }

    get Repeat () {
        return repeat;
    }

    async render () {
        let tempalteStream = render (this.template);
        let chunks = [];

        for await (const chunk of tempalteStream) {
            chunks.push(chunk.toString());
        }

        return chunks;
    }

    _setAttributes (attributes) {
        for (let attribute in attributes) {
            if (!(attribute in this.attributes))
                continue;
            this [attribute] = attributes [attribute];
        }
    }

    _createGetterAndSetter () {
        this._attributes = this.attributes;

        for (let property in this.attributes) {
            Object.defineProperty(this, property, {
                get: () => {
                    let val = this._attributes [property];
                    try {
                        return JSON.parse (val);
                    } catch (e) {
                        return val;
                    }
                },
                set: (newValue) => {
                    this._attributes [property] = newValue;
                }
            });
        }
    }

}

module.exports = SSRBaseElement;