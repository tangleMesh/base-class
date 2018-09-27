import {html, render} from './../node_modules/lit-html/lit-html.js';
import {repeat} from '../node_modules/lit-html/directives/repeat.js';
class BaseElement extends HTMLElement {

    get template () {
        return this.Template`<slot></slot>`;
    }

    get attributes () {
        return {};
    }

    get dataAttributes () {
        return [];
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
            this [property] = this.attributes [property];
        }

        this.beforeMount ();


        //Creation of the Data(Form)-Attributes as hidden-inputs
        this._createDataAttributes ();

        //Render the Template
        this._render ();

        //Create Observer for the Component-Attributes
        this._createAttributeObserver ();
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
        //Create Hidden-Inputs for Data-Attributes (Form recognition)
        this._dataAttributeInputs = {};
        this.dataAttributes.forEach (componentAttribute => {
            //Create the Input-Element
            let input = document.createElement ('input');
            input.hidden = true;  //For hiding the dom-element
            //input.dataset.baseDataAttribute = componentAttribute;
            input.setAttribute ('type', 'hidden');
            input.setAttribute ('name', componentAttribute);
            input.setAttribute ('value', this.getAttribute (componentAttribute));

            //Append and save the Input-Element
            this._dataAttributeInputs [componentAttribute] = input;
            this.appendChild (input);
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
                this [e.target.name] = e.target.value;
                this._lastInputElement = e.target;
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

        //Update the hidden-input with the new data!
        if (this.dataAttributes.includes (attributeName)) {
            this._dataAttributeInputs [attributeName].setAttribute ('value', newValue);
        }

        this._render ();
    }

    _createGetterAndSetter () {
      for (let property in this.attributes) {
          Object.defineProperty(this, property, {
              get: () => {
                  let val = this.getAttribute (property);
                  try {
                      return JSON.parse (val);
                  } catch (e) {
                      return val;
                  }
              },
              set: (newValue) => {
                  this.setAttribute (property, typeof newValue === "object" ? JSON.stringify (newValue) : newValue);
              }
          });
      }
    }

    constructor() {
        //Always call Super-Contstructor!
        super();

        this._createGetterAndSetter ();
        this._isServer = false;

        this.beforeCreated ();

        this._isInitialized = false;

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

}

export default BaseElement;
