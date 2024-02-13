

// TODO: ability to apply a different parts of the theme to different parts of the application concurrently

export class Theme {

    static darkSelector: string = 'svg.frame';
    static lightSelector: string = '.light-theme svg.frame';

    private selector: string;

    constructor(selector: string = Theme.darkSelector) {
        this.selector = selector;
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

        if (!found) {
            console.warn(`Selector 'svg.frame' not found. Variable '${name}' not set.`);
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


