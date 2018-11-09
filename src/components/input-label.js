import BaseElement from '/scripts/base-element.js'

class InputLabel extends BaseElement {


    get template () {
        return this.Template`
        <style>
            input {
                border: ${this.BorderNumber ()}px solid black;
            }
        </style>
        <input ?disabled=${this.disabled} type="number" value=${this.number} data-model="number" name="${this ['number-input']}" /> <slot name="test"></slot><slot></slot>: <b>${this.number}</b>
        
        <ul>
            ${this.Repeat(
            this.list.slice (0, this.number),
            (item, idx) => this.list [idx],
            (item, idx) => this.Template`
              <li style="background-color: ${ idx % 2 === 0 ? '#d3d3d3' : 'red' }" >${item}</li>
            `
        )}
        </ul>
        
        <h1>${ this.isServer ? 'Rendered on Server!' : 'Rendered on Client!' }</h1>
        
        <button @click="${() => this.ToggleButtonClicked ()}" type="button">Toggle!</button>
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
            'test': '',
            'number-input': 'form12'
        };
    }

    serverInit () {
        //this.number = 6;
    }

    created () {
        //Make the Input enabled, when there is javascript disabled
        if (this.isServer)
            this.disabled = false;
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
                //Example: Execute Custom Event named: custom (data-event-custom="…")
                this.$emit ('custom', this.number, this.disabled);
        }
        console.log("attributeUpdated ()", attributeName, oldValue, newValue);

    }

    updated () {
        console.log("updated ()");
    }

    get MaxNumber () {
        return 50;
    }

    mounted () {
        this.disabled = true;
        console.log ("mounted ()", this.disabled, this.number, Date.now(), this.constructor.name, this.test);
    }

}

window.customElements.define('input-label', InputLabel);