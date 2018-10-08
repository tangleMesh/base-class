import {html, render} from './../node_modules/lit-html/lit-html.js';
import {repeat} from '../node_modules/lit-html/directives/repeat.js';
class BaseElement extends HTMLElement {

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

    //Before the element's template gets created
    beforeMount () {}

    //The element has been added to the dom + shadow-dom!
    mounted () {}

    //The element has been removed from the dom (not guaranteed that this will be called (ex. closed tab by user, …))
    dismounted () {}

    //The element has been attatched to a new document
    mountedNewDocument () {}

    //A observed attribute has been updated
    attributeUpdated (attributeName, oldValue, newValue) {}

    //When a re-render triggered and the element may be updated
    updated () {}

    connectedCallback () {
        for (let property in this.attributes) {
            //Save attribtues and if not existing the default values
            if (this.hasAttribute (property)) {
                this [property] = this._getAttribute(property);
            } else {
                this [property] = this.attributes [property];
            }
        }

        this.beforeMount ();

        //Render the Template
        this._render ();

        //Create Observer for the Component-Attributes
        this._createAttributeObserver ();

        //Creation of the Data(Form)-Attributes as hidden-inputs only if shadow-dom exists
        this._createDataAttributes ();

        //Create default events for submits, …
        this._createEvents ();
        this._isInitialized = true;

        this.mounted ();
    }

    get Template () {
        return html;
    }

    get Repeat () {
        return repeat;
    }

    _createDataAttributes () {
        //Check if Shadow-Dom is supported:
        if (!document.head.createShadowRoot || !document.head.attachShadow) return;
        //Get All Input-Elements of this Component
        let inputElements = this.shadowRoot.querySelectorAll ('input');

        inputElements.forEach (inputElement => {
            //Check if Name-Attribute exists
            if (!inputElement.hasAttribute ('name')) return;

            //Read Values of Input-Element
            let name = inputElement.getAttribute ('name');
            let hiddenInput = document.createElement ('input');

            if (Object.keys (this._dataAttributeInputs).includes (name)) return;

            //Create Hidden-Input-Element
            hiddenInput.hidden = true; //For hiding the dom-element
            hiddenInput.setAttribute ('type', 'hidden');
            hiddenInput.setAttribute ('name', name);
            hiddenInput.setAttribute ('value', inputElement.getAttribute ('value'));

            //Append and save the Hidden-Input-Element
            this._dataAttributeInputs [name] = hiddenInput;
            this.appendChild (hiddenInput);
        });
    }


    //Only Updates the specific Elements, that need an Update
    _render () {
        render( this.template, this.shadowRoot);

        if (this._isInitialized)
            this.updated ();
    }

    _createEvents () {
        //When submit, add click-event
        Array.from (this.shadowRoot.querySelectorAll ('button')).forEach (button => {
            if (button.getAttribute ('type') !== 'submit') {
                button.setAttribute ('type', 'button');
                return;
            };
            button.addEventListener('click', (e) => {
                this.closest('form').submit ();
            });
        });

        //When input, add changed-event
        Array.from (this.shadowRoot.querySelectorAll ('input')).forEach (input => {
            input.addEventListener('input', (e) => {
                let modelName = e.target.getAttribute ('data-model');
                let inputName = e.target.name;
                let inputValue = e.target.value;

                //Update property if exists!
                if (modelName !== null && Object.keys (this.attributes).includes (modelName)) {
                    this [modelName] = inputValue;
                    this._lastInputElement = e.target;
                }

                //Update hidden-inputs
                if (Object.keys (this._dataAttributeInputs).includes (inputName)) {
                    this._dataAttributeInputs [inputName].setAttribute ('value', inputValue);
                }

            });
        });
    }

    //Create own observer to be more dynamic!
    _createAttributeObserver () {
        this.oldAttributeValues = {};
        for (let property in this.attributes) {
            this.oldAttributeValues [property] = this.getAttribute (property);
        }

        this.observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes') {
                    let newVal = mutation.target.getAttribute (mutation.attributeName);
                    this.attributeChangedCallback (mutation.attributeName, this.oldAttributeValues [mutation.attributeName], newVal);
                    this.oldAttributeValues [mutation.attributeName] = newVal;
                }
            });
        });
        this.observer.observe(this, {attributes: true});
    }

    attributeChangedCallback(attributeName, oldValue, newValue) {
        if (typeof this.attributes [attributeName] === "undefined" || !this._isInitialized) return;

        this.attributeUpdated (attributeName, oldValue, newValue);

        if (typeof this._lastInputElement !== "undefined") {
            this._lastInputElement.setAttribute ('value', this [attributeName]);
            this._lastInputElement.value = this [attributeName];
            delete this._lastInputElement;
        }

        //Update the hidden-input with the new data!, if shadow dom exists
        if (Object.keys (this._dataAttributeInputs).includes (attributeName)) {
            this._dataAttributeInputs [attributeName].setAttribute ('value', newValue);
        }

        this._render ();
    }

    _createGetterAndSetter () {
      for (let property in this.attributes) {
          Object.defineProperty(this, property, {
              get: () => {
                  return this._getAttribute(property);
              },
              set: (newValue) => {
                  this.setAttribute (property, typeof newValue === "object" ? JSON.stringify (newValue) : newValue);
              }
          });
      }
    }

    _getAttribute (property) {
        let val = this.getAttribute (property);
        try {
            return JSON.parse (val);
        } catch (e) {
            return val;
        }
    }

    constructor() {
        //Always call Super-Contstructor!
        super();

        this._createGetterAndSetter ();
        this._isServer = false;

        this.beforeCreated ();

        this._isInitialized = false;
        //Create Hidden-Inputs for Data-Attributes (Form recognition)
        this._dataAttributeInputs = {};

        // Attach a shadow root to the element.
        this.attachShadow({mode: 'open'});

        this.created ();
    }

    disconnectedCallback () {
        //The Custom-Element has detatched from the DOM!
        this.dismounted ();
    }

    adoptedCallback () {
        //The Custom-Element has been moved into a new document!
        this.mountedNewDocument ();
    }

    //TODO: Find a better way to do this maybe
    $emit (functionName, ...values) {
        //TODO: if functionName this.XXX, then this should be converted to the parent-element or something!
        let functionString = this.dataset ['event' + functionName.substr (0, 1).toUpperCase () + functionName.substr (1)];
        if (functionString === null || typeof functionString !== "string")
            return;
        let eventFunction = eval (functionString);
        return eventFunction (...values);
    }

}

export default BaseElement;
