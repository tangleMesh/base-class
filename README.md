# BaseClass

A simple BaseClass for creating native web components with in-built lifecycle and templating!


## Functionality

* for-loops in template with `${this.Repeat(…)}`
* conditional attributes, … with `?disabled=${this.isDisabled}`
* build-in lifecycle-methods
* native javascript expressions
* computed properties with native methods `<span>${this.getInfotext ()}</span>`
* events / actions with `@click="${ () => this.buttonClickedEvent () }"`


## Example

Creating a custom web component is as easy as inherit from the BaseElement-Class and implementing the `init () {…}` function. There you can define the template and optionally the style, attributes and data-attributes.

```
import BaseElement from './src/base-element.js'

class CustomButton extends BaseElement {

    init () {
        
        //component's template
        this.componentTemplate = this.Template`
            <style>
                button {
                    background-color: darkblue;
                    color: white;
                    border: ${ this.number * 2 }px solid #d3d3d3;
                }
            </style>
        
            
            <button>
                <slot></slot> / <b>${ this.number }</b> / ${ 2 + 4 }
            </button>
        `;
    
        //component's attributes (get's updated automatically on changes)
        this.componentAttributes = {
            'label': 'TEST',
            'number': 23
        };
    
        //attributes which should be recognized by forms as inputs
        this.componentDataAttributes = ['number'];
    
    }

}
```


## init function

With the init function you define the new web component. 
You have to define a template, otherwise simply the slot's content will be displayed.

Additionally you can define some component attributes which will be updated automatically when changing them via javascript or otherwise.

Because of the structure of web components (custom elements with shadow root), the form-input elements will not be recognized by default by forms. So they do not send them with the "normal" input-fields. The encapsulation of the shadow dom is the reason for that. Because of that the base-class automatically creates hidden elements for each attribute defined in `componentDataAtrribtues`. So the defined attributes will be recognized by forms.


### Properties of init function

* `componentTemplate` - the template of the component with also inline commands for js {{ 2+6 }} or {{ this.customAttribute }}
* `componentAttributes` - the attributes this component should support (all usings in template will automatically update)
* `componentDataAttributes` - the attributes which should be recognized by forms


## component lifecycle 

![component's lifecycle](img/component-lifecycle.svg)
