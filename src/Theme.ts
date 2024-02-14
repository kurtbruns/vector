

export class Theme {

    private static instance: Theme;

    private darkSelector: string = 'svg.frame';

    private lightSelector: string = '.light-theme svg.frame';

    private style : HTMLStyleElement;

    private mode: 'light' | 'dark';

    private light: { [key: string]: string } = {
        '--background': '#ffffff',
        '--background-darker': '#f8f8f8',
        '--background-lighter': '#f0f0f0',
        '--font-color': '#404040',
        '--border-color': '#d0d0d0',
        '--grid-primary': '#c0c0c0',
        '--grid-secondary': '#d0d0d0',
        '--grid-tertiary': '#f0f0f0',
        '--grid-quaternary': '#f4f4f4',
        '--grid-quinary': '#f8f8f8',
        '--main': '#404040',
        '--primary': '#485bfc',
        '--secondary': '#4bb77e',
        '--tertiary': '#c74440',
        '--red': '#c74440',
        '--green': '#40a839',
        '--blue': '#485bfc',
    };

    private dark: { [key: string]: string } = {
        '--background': '#181818',
        '--background-darker': '#181818',
        '--background-lighter': '#303030',

        '--main': '#f0f0f0',
        '--font-color': '#f0f0f0',
        '--font-color-light': '#a0a0a0',

        '--border-color': '#606060',
        '--primary': '#fee9af',
        '--grid-primary': '#505050',
        '--grid-secondary': '#404040',
        '--grid-tertiary': '#303030',
        '--grid-quaternary': '#303030',
        '--grid-quinary': '#282828',
        '--red': '#f2777a',
        '--green': '#92d192',
        '--blue': '#6ab0f3',
        '--yellow': '#fff888',
    }

    // Make the constructor private.
    private constructor() {

        this.mode = 'dark';

        this.style = document.createElement('style');
        this.style.id = 'vector-style';
        document.head.appendChild(this.style);

        let lightRule = `
${this.lightSelector} {
            ${Object.entries(this.light).map(([key, value]) => `${key}: ${value};`).join(' ')}
}`;

        let darkRule = `
${this.darkSelector} 
    {${Object.entries(this.dark).map(([key, value]) => `${key}: ${value};`).join(' ')}
}`;
        this.style.sheet.insertRule(darkRule, this.style.sheet.cssRules.length);
        this.style.sheet.insertRule(lightRule, this.style.sheet.cssRules.length);
    }

    // Static method for getting the instance.
    public static getInstance(): Theme {
        if (!Theme.instance) {
            Theme.instance = new Theme();
        }
        return Theme.instance;
    }

    private get selector(): string {
        if (this.mode === 'light') {
            return this.lightSelector;
        } else {
            return this.darkSelector;
        }
    }

    public setVariable(name: string, value: string): void {

        // Ensure the variable name starts with '--'
        if (!name.startsWith('--')) {
            name = '--' + name;
        }

        let found = false;

        for (let j = 0; j < document.styleSheets.length; j++) {
            let stylesheet = document.styleSheets[j];
            let rules = stylesheet.cssRules;

            for (let i = 0; i < rules.length; i++) {
                let rule = rules[i];
                if (rule instanceof CSSStyleRule && rule.selectorText === this.selector) {
                    // Check if the property already exists
                    const currentPropertyValue = rule.style.getPropertyValue(name);
                    if (currentPropertyValue !== undefined) {
                        // Update the property value
                        rule.style.setProperty(name, value);
                        found = true;
                        break;
                    } else {
                        // Add the new property and value
                        rule.style.setProperty(name, value);
                        found = true;
                        break;
                    }
                }
            }

            if (found) break; // Exit once the variable has been set
        }

        // If the selector was not found, create a new CSS rule
        if (!found) {
            console.log(`Selector '${this.selector}' not found. Created new rule and set variable '${name}' to '${value}'.`);
        }
    }

    public getVariable(name: string): string {

        // Ensure the variable name starts with '--'
        if (!name.startsWith('--')) {
            name = '--' + name;
        }

        for (let j = 0; j < document.styleSheets.length; j++) {

            let stylesheet = document.styleSheets[j];
            let rules = stylesheet.cssRules;

            for (let i = 0; i < rules.length; i++) {
                let rule = rules[i];
                if (rule instanceof CSSStyleRule && rule.selectorText === this.selector) {
                    // Iterate over all properties in the rule
                    for (let k = 0; k < rule.style.length; k++) {
                        const propertyName = rule.style.item(k);

                        if (propertyName.startsWith(name)) {
                            return rule.style.getPropertyValue(propertyName);
                        }
                    }
                }
            }
        }

        return undefined;
    }

    public *getVariables() {

        for (let j = 0; j < document.styleSheets.length; j++) {

            let stylesheet = document.styleSheets[j];
            let rules = stylesheet.cssRules;

            for (let i = 0; i < rules.length; i++) {
                let rule = rules[i];
                if (rule instanceof CSSStyleRule && rule.selectorText === this.selector) {
                    // Iterate over all properties in the rule
                    for (let k = 0; k < rule.style.length; k++) {
                        const propertyName = rule.style.item(k);

                        // yield return variables
                        if (propertyName.startsWith('--')) {
                            const value = rule.style.getPropertyValue(propertyName);
                            yield { propertyName, value };
                        }
                    }
                    break;
                }
            }
        }

    }


}


