import BaseElement from './src/base-element.js'

class InputLabel extends BaseElement {


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

        let list = [];
        for (let i = 0; i <= this.MaxNumber; i++)
            list.push (`List entry no. ${i+1}`);

        return {
            'number': 11,
            'list': list,
            'disabled': true,
        };
    }

    get dataAttributes () {
        return [
            'number'
        ];
    }

    ToggleButtonClicked () {
        this.disabled = !this.disabled;
    }

    BorderNumber () {
        return this.number * 2;
    }

    //Before the element's template gets created
    beforeMount () {
        //Read Prop from Query if it exists
        let query = new URLSearchParams(window.location.href);
        let number = query.get('number');
        this.number = number ? number : this.number;
    }

    //A observed attribute has been updated
    attributeUpdated (attributeName, oldValue, newValue) {
        switch (attributeName) {
            case 'number':
                if (newValue > this.MaxNumber) this.number = 0;
                if (newValue < 0) this.number = this.MaxNumber;
        }
    }

    updated () {
        console.log("Updated!");
    }

    get MaxNumber () {
        return 50;
    }

}

window.customElements.define('input-label', InputLabel);