import BaseElement from './src/base-element.js'

class InputLabel extends BaseElement {

    init () {
        //template
        this.componentTemplate = () => this.Template`
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

        //Public Form-Data, available for other components
        this.componentDataAttributes = ['number'];

        //Observed variables
        this.componentAttributes = {
            'number': 11,
            'list': [
                'nr',
                'name',
                'title',
                'test 224',
                'nr',
                'name',
                'title',
                'test 224',
                'nr',
                'name',
                'title',
                'test 224',
                'nr',
                'name',
                'title',
                'test 224',
                'nr',
                'name',
                'title',
                'test 224',
                'nr',
                'name',
                'title',
                'test 224'
            ],
            'disabled': true,
        };
    }

    ToggleButtonClicked () {
        this.disabled = !this.disabled;
    }

    BorderNumber () {
        console.log(this.number * 2);
        return this.number * 2;
    }

    //Before the element's template gets created
    beforeMount () {
        //this.number = 22;
    }

    //A observed attribute has been updated
    attributeUpdated (attributeName, oldValue, newValue) {
        console.log(attributeName, oldValue, newValue);
    }

    updated () {
        console.log("Updated!");
    }

}

window.customElements.define('input-label', InputLabel);