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

    private lightRule: CSSRule;
    private darkRule: CSSRule;

    // Temporary storage for clearing and restoring rules
    private tempLightRule: CSSRule | null = null;
    private tempDarkRule: CSSRule | null = null;

    /**
     * Private constructor to prevent direct class instantiation
     * and ensure only one instance is created.
     */
    private constructor() {

        // Light theme variables
        let lightVariables: { [key: string]: string } = this.getLightVariables()

        // Dark theme variables
        let darkVariables: { [key: string]: string } = this.getDarkVariables();

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

            // Construct dark mode CSS rule
            let darkRuleString = `${this.getSelector()} { ${Object.entries(darkVariables).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;

            // Construct light mode CSS rule separately
            let lightRuleString = `${this.getSelector()} { ${Object.entries(lightVariables).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;

            // Insert the dark rule first, and then the media query for light
            let darkIndex = this.style.sheet.insertRule(darkRuleString, this.style.sheet.cssRules.length);

            this.darkRule = this.style.sheet.cssRules[darkIndex];

            // Insert light rule inside a media query
            const lightMediaQuery = `@media (prefers-color-scheme: light) { ${lightRuleString} }`;
            const lightRuleIndex = this.style.sheet.insertRule(lightMediaQuery, this.style.sheet.cssRules.length);

            // Retrieve the media query rule
            const mediaRule = this.style.sheet.cssRules[lightRuleIndex];

            // Retrieve the actual CSSStyleRule inside the media query and store it in this.lightRule
            if (mediaRule instanceof CSSMediaRule) {
                this.lightRule = mediaRule.cssRules[0]; // Assuming the light rule is the first and only rule in the media query
            }
        }
    }

    private getLightVariables() {
        return {
            '--background': '#ffffff',
            '--background-darker': '#f8f8f8',
            '--background-lighter': '#f4f4f4',

            '--main': '#404040',
            '--medium': '#808080',
            '--faint': '#e6e6e6',

            '--font-color': '#404040',
            '--border-color': '#e0e0e0',

            '--grid-primary': '#b0b0b0',
            '--grid-secondary': '#d0d0d0',
            '--grid-tertiary': '#f0f0f0',
            '--grid-quaternary': '#f4f4f4',
            '--grid-quinary': '#f8f8f8',

            '--primary': '#485bfc',
            '--secondary': '#4bb77e',
            '--tertiary': '#c74440',

            '--red': '#c74440',
            '--green': '#40a839',
            '--blue': '#485bfc',
            '--teal': '#1aa59b',
            '--cyan': '#1aa59b',
            // '--pink': '#db32c6',
            '--pink': '#D64DC5',
            '--yellow': '#1aa59b',
            '--purple': '#a452ce',
            '--orange': '#D48037',
        };
    }

    private getDarkVariables() {
        return {
            // '--background': '#181818',
            '--background': '#000000',
            // '--background': '#101010',
            '--background-darker': '#181818',
            '--background-lighter': '#181818',

            '--main': '#f0f0f0',
            '--medium': '#808080',
            '--faint': '#404040',

            '--font-color': '#f0f0f0',
            '--font-color-light': '#a0a0a0',
            '--border-color': '#404040',
            '--primary': '#fee9af',

            '--grid-primary': '#505050',
            '--grid-secondary': '#404040',
            '--grid-tertiary': '#303030',
            '--grid-quaternary': '#303030',
            '--grid-quinary': '#282828',

            // Darken for export because of final cut

            // '--red': '#f2777a',
            // '--green': '#92d192',
            // '--blue': '#6ab0f3',
            // '--cyan': '#8afdff',
            // '--yellow': '#fff888',
            // '--pink': '#ff89e7',
            // '--magenta': '#ff89e7',
            // '--teal': '#8afdff',

            '--red': '#E76E71',
            '--green': '#92d192',
            '--blue': '#6ab0f3',
            '--cyan': '#8afdff',
            '--teal': '#8afdff',
            '--yellow': '#FFF461',
            '--pink': '#FF70E3',
            '--magenta': '#FF70E3',

            '--purple': '#db94ff',
            '--orange': '#ff9f4c',
        }

    }

    /**
     * 
     * @returns Returns the theme mode, either 'light' or 'dark'
     */
    getMode() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        } else {
            return 'dark';
        }
    }

    /**
     * @returns The selector for this theme instance.
     */
    getSelector() {
        return `.${this.id}`;
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
 * Temporarily removes the light or dark rule and allows forcing the opposite theme.
 * @param mode The theme mode to force ('light' or 'dark').
 */
    public forceMode(mode: 'light' | 'dark') {
        if (mode === 'light') {
            this.clearDarkRule();
            this.applyForcedLightMode();
        } else {
            this.clearLightRule();
            this.applyForcedDarkMode();
        }
    }

    /**
     * Restores the original light or dark rule if it was cleared.
     */
    public restoreMode() {
        if (this.tempLightRule) {
            this.restoreLightRule();
        }
        if (this.tempDarkRule) {
            this.restoreDarkRule();
        }
    }

    private clearLightRule() {
        if (this.lightRule && this.style.sheet) {
            // Store the current light rule temporarily
            this.tempLightRule = this.lightRule;

            // Delete the light rule from the stylesheet
            for (let i = 0; i < this.style.sheet.cssRules.length; i++) {
                if (this.style.sheet.cssRules[i] === this.lightRule) {
                    this.style.sheet.deleteRule(i);
                    break;
                }
            }

            this.lightRule = null;
        }
    }

    private clearDarkRule() {
        if (this.darkRule && this.style.sheet) {
            // Store the current dark rule temporarily
            this.tempDarkRule = this.darkRule;

            // Delete the dark rule from the stylesheet
            for (let i = 0; i < this.style.sheet.cssRules.length; i++) {
                if (this.style.sheet.cssRules[i] === this.darkRule) {
                    this.style.sheet.deleteRule(i);
                    break;
                }
            }

            this.darkRule = null;
        }
    }

    private restoreLightRule() {
        if (this.tempLightRule && this.style.sheet) {
            // Reinsert the temporarily stored light rule
            const lightRuleString = this.tempLightRule.cssText;
            this.style.sheet.insertRule(lightRuleString, this.style.sheet.cssRules.length);

            // Restore the light rule and clear the temporary storage
            this.lightRule = this.tempLightRule;
            this.tempLightRule = null;
        }
    }

    private restoreDarkRule() {
        if (this.tempDarkRule && this.style.sheet) {
            // Reinsert the temporarily stored dark rule
            const darkRuleString = this.tempDarkRule.cssText;
            this.style.sheet.insertRule(darkRuleString, this.style.sheet.cssRules.length);

            // Restore the dark rule and clear the temporary storage
            this.darkRule = this.tempDarkRule;
            this.tempDarkRule = null;
        }
    }

    private applyForcedLightMode() {
        const lightRuleString = `${this.getSelector()} { ${Object.entries(this.getLightVariables()).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;
        this.style.sheet.insertRule(lightRuleString, this.style.sheet.cssRules.length);
    }

    private applyForcedDarkMode() {
        const darkRuleString = `${this.getSelector()} { ${Object.entries(this.getDarkVariables()).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;
        this.style.sheet.insertRule(darkRuleString, this.style.sheet.cssRules.length);
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
     * @param mode The theme mode ('light' or 'dark'). Defaults to 'dark'.
     */
    public setVariable(name: string, value: string, mode: 'light' | 'dark' = 'dark'): void {

        // Ensure the variable name starts with '--'
        if (!name.startsWith('--')) {
            name = '--' + name;
        }

        // Use stored dark or light rule to set the property
        if (mode === 'dark' && this.darkRule instanceof CSSStyleRule) {
            this.darkRule.style.setProperty(name, value);
        }

        if (mode === 'light' && this.lightRule instanceof CSSStyleRule) {
            this.lightRule.style.setProperty(name, value);
        }
    }

    /**
     * Retrieves the value of a CSS variable for the current theme.
     * @param name The name of the CSS variable to retrieve.
     * @param mode The theme mode to use ('light' or 'dark'). Defaults to the current mode.
     * @returns The value of the CSS variable or undefined if the variable is not found.
     */
    public getVariable(name: string, mode: 'light' | 'dark' = this.getMode()): string | undefined {

        // Ensure the variable name starts with '--'
        if (!name.startsWith('--')) {
            name = '--' + name;
        }

        // Retrieve the value from the stored dark or light rule
        let rule: CSSStyleRule | undefined;
        if (mode === 'dark' && this.darkRule instanceof CSSStyleRule) {
            rule = this.darkRule;
        } else if (mode === 'light' && this.lightRule instanceof CSSStyleRule) {
            rule = this.lightRule;
        }

        if (rule) {
            // Iterate over all properties in the rule to find the requested CSS variable
            for (let i = 0; i < rule.style.length; i++) {
                const propertyName = rule.style.item(i);
                if (propertyName === name) {
                    return rule.style.getPropertyValue(propertyName);
                }
            }
        }

        return undefined;
    }

}
