import { Frame } from "./elements";

/**
 * Singleton class to manage theme styles for a web application.
 * Allows switching between 'light' and 'dark' mode and applying these
 * themes to given elements.
 */
export class Theme {

    /**
     * Singleton instance of class
     */
    private static instance: Theme;

    /**
    * Almost garuanteed unique id.
    */
    private id: string;

    /**
     * Style element holds css variables
     */
    private style: HTMLStyleElement;

    /**
     * Light theme CSS varaibles.
     */
    private light: { [key: string]: string };


    /**
     * Dark theme CSS varaibles.
     */
    private dark: { [key: string]: string };

    /**
     * Private constructor to prevent direct class instantiation
     * and ensure only one instance is created.
     */
    private constructor() {

        this.light = {
            '--background': '#ffffff',
            '--background-darker': '#f8f8f8',
            '--background-lighter': '#f0f0f0',

            '--font-color': '#404040',
            '--border-color': '#e0e0e0',

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

        this.dark = {
            '--background': '#181818',
            '--background-darker': '#181818',
            '--background-lighter': '#303030',

            '--main': '#f0f0f0',
            '--medium': '#808080',
            '--font-color': '#f0f0f0',
            '--font-color-light': '#a0a0a0',
            '--border-color': '#404040',
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

        const uniqueTime = () => {
            const now = new Date();
            const highResTime = performance.now();
            return `${now.getTime()}.${Math.floor(highResTime)}`;
        };

        this.id = `vector-${this.hash(uniqueTime(), 7)}`;

        let style;
        if (style = document.querySelector(`#${this.id}`)) {
            this.style = style;
        } else {
            this.style = document.createElement('style');
            this.style.id = this.id;
            document.head.appendChild(this.style);

            let lightRule = `${this.lightSelector} { ${Object.entries(this.light).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;
            let darkRule = `${this.darkSelector} {${Object.entries(this.dark).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;
            this.style.sheet.insertRule(darkRule, this.style.sheet.cssRules.length);
            this.style.sheet.insertRule(lightRule, this.style.sheet.cssRules.length);
        }

    }

    /**
     * Returns the CSS selector associated with the light theme.
     */
    get lightSelector() : string {
        return `.light-theme .${this.id}`;
    }

    /**
     * Returns the CSS selector associated with the dark theme.
     */
    get darkSelector() : string {
        return `.${this.id}`;
    }

    /**
     * Returns the CSS selector associated with the theme mode.
     */
    getSelector(mode:string) : string {
        switch( mode ) {
            case 'light':
                return this.lightSelector;
            case 'dark':
                return this.darkSelector;
        }
    }

    /**
     * Generates a hash based on the input string. Used for generating unique class names.
     * @param input The string to hash.
     * @param length The desired length of the hash. Defaults to 7.
     * @returns A string hash of the input.
     */

    hash(input: string, length: number = 7): string {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        hash = Math.abs(hash); // Ensure positive integer
    
        // Convert to base 36 (0-9, a-z) and pad/truncate to desired length
        let hashStr = hash.toString(36);
        if (hashStr.length > length) {
            hashStr = hashStr.substring(0, length);
        } else {
            while (hashStr.length < length) {
                hashStr = '0' + hashStr;
            }
        }
    
        return hashStr;
    }


    /**
      * Applies the current theme to the specified frame by adding CSS variables.
      * @param frame The frame element to apply the theme to.
      */
    applyTheme(frame: Frame) {
        frame.classList.add(this.id);
    }

    /**
     * Retrieves the singleton instance of the Theme class, creating it if it does not already exist.
     * @returns The singleton instance of the Theme class.
     */
    public static getInstance(): Theme {
        if (!Theme.instance) {
            Theme.instance = new Theme();
        }
        return Theme.instance;
    }

    /**
     * Sets a CSS variable for the current theme.
     * @param name The name of the CSS variable to set.
     * @param value The value to assign to the variable.
     */
    public setVariable(name: string, value: string, mode: 'light' | 'dark' = 'dark'): void {

        // Ensure the variable name starts with '--'
        if (!name.startsWith('--')) {
            name = '--' + name;
        }
        
        let rules = this.style.sheet.cssRules;

        for (let i = 0; i < rules.length; i++) {
            let rule = rules[i];
            if (rule instanceof CSSStyleRule && rule.selectorText === this.getSelector(mode)) {
                // Check if the property already exists
                const currentPropertyValue = rule.style.getPropertyValue(name);
                if (currentPropertyValue !== undefined) {
                    rule.style.setProperty(name, value);
                    break;
                } else {
                    rule.style.setProperty(name, value);
                    break;
                }
            }
        }

    }

    /**
      * Retrieves the value of a CSS variable for the current theme.
      * @param name The name of the CSS variable to retrieve.
      * @returns The value of the CSS variable or undefined if the variable is not found.
      */
    public getVariable(name: string, mode: 'light' | 'dark' = 'dark'): string {

        // Ensure the variable name starts with '--'
        if (!name.startsWith('--')) {
            name = '--' + name;
        }

        let rules = this.style.sheet.cssRules;

        for (let i = 0; i < rules.length; i++) {
            let rule = rules[i];
            if (rule instanceof CSSStyleRule && rule.selectorText === this.getSelector(mode)) {
                // Iterate over all properties in the rule
                for (let k = 0; k < rule.style.length; k++) {
                    const propertyName = rule.style.item(k);

                    if (propertyName.startsWith(name)) {
                        return rule.style.getPropertyValue(propertyName);
                    }
                }
            }
        }

        return undefined;
    }

}


