# BaseClass

A simple BaseClass for creating native web components with built-in lifecycle and templating!


Todo's:
* Write Documentation and Create Website


## Getting started

### Client Library
To build native web-components with all the features below, you can simply import the `base-element.js` into your project.
> `<script src="https://raw.githubusercontent.com/JeremiasEh/base-class/master/scripts/base-element.js" /><script>`


### SSR static pages
To enable Server-side rendering, you can simply clone this repository.
In order to get your own components and pages server-side rendered, you can simply create a git submodule with your repository including:
* static html pages
* webcomponents (inherited from base-element)
* any assets you like

This repository for example uses the `src` folder for this purpose. This of course is free configurable with the `config.json`.


### SSR dynamic pages
To ssr dynamic web-sites, you have to use the built-in api of this server, to send the html and to receive the pre-rendered html back.
The api can certainly be protected with authorization, to prevent others from using your server. Therefore you can configure the server to verify JWT-Tokens sent by the requesting party.

#### Add Git Submodule

To add your own Repository inside this one, simply run `git submodule add`. Before this, you should delete the `src` folder completely or use another folder for your pages, assets and components.
> `$ git submodule add https://your-repository.org/your-repo.git src`

After this step, your own repository should appear in a `src` folder or however you named it. With this approach you can on the one hand update the base-class repositority, if there are some new features or bug-fixes. On the other hand you can update your own repository and you have the full control over your custom components, pages and other files.

*If you use another folder structure inside your git submodule, you have to adjust the `config.json` (application.pagesDirectory, application.componentsDirectory, application.assetDirectories) to map it to your new folder-structure!*



## Functionality

* for-loops in template with `${this.Repeat(…)}`
* conditional attributes, … with `?disabled=${this.isDisabled}`
* build-in lifecycle-methods
* native javascript expressions
* computed properties with native methods `<span>${this.getInfotext ()}</span>`
* events / actions inside template/component with `@click="${ () => this.buttonClickedEvent () }"`
* events / actions outside component with named events like `data-event-custom="(componentElement, value1, value2, …) { … }"` and execute them from inside the component with `this.$emit ('custom', this.value1, this.value2, …);`
* detect SSR or Client-Rendering with the `isServer` attribute! (e.g. `if (this.isServer) { /*Do some things only on server*/} else { /*Do some things only on client*/}`)

## Example

Creating a custom web component is as easy as inherit from the BaseElement-Class and implementing the basic getter `template (), attributes ()` functions. There you can define the template with optional style and attributes.

```
import BaseElement from './src/base-element.js'

class CustomButton extends BaseElement {

    get template () {
            return this.Template`
            <style>
                input {
                    border: ${this.BorderNumber ()}px solid black;
                }
            </style>
            <input ?disabled=${this.disabled} type="number" value=${this.number} name="number" /> <slot></slot>: <b>${this.number}</b>
            
            <ul>
                ${this.Repeat(
                this.list.slice (0, this.number),
                (item, idx) => this.list [idx],
                (item, idx) => this.Template`
                  <li style="background-color: ${ idx % 2 === 0 ? '#d3d3d3' : 'red' }" >${item}</li>
                `
            )}
            </ul>
            
            <button @click="${() => this.ToggleButtonClicked ()}">Toggle!</button>
        `;
        }
    
        get attributes () {
            return {
                'number': 11,
                'list': [
                    'test1',
                    'test2',
                    'test3'
                ],
                'disabled': true,
            };
        }
}
```


## getter methods

With the init function you define the new web component. 
You have to define a template, otherwise simply the slot's content will be displayed.

Additionally you can define some component attributes which will be updated automatically when changing them via javascript or otherwise.


### methods

* `get template () {…} - lit-html template literal` - the templat  of the component with also inline commands for js {{ 2+6 }} or {{ this.customAttribute }}
* `get attributes () {…} - object` - the attributes this component should support (all usings in template will automatically update)


## component lifecycle 

![component's lifecycle](img/component-lifecycle.svg)

*On Serverside, only the methods before the element get's attatched to the DOM are getting executed with the additional `serverInit ()` callback. (SSR-Methods: `beforeCreated ()`, `created ()`, `serverInit ()`). The serverInit-Method will be called only while rendering on server and will be executed directly after the created-Method. Here you can define some special things for server-rendering only!*


## Known limitations

### Properties inside template style-attributes

When using component-properties inside the template, the values get's displayed and updated automatically.
But when rendering the component on server-side and the browser does not support web components, all equal components will have the style-values of the last element inserted!