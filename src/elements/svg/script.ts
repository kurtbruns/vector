import { BaseElement, CoreAttributes } from './base-element'

type ScriptAttributes = 'type' | 'crossorigin' | 'href';

export class Script extends BaseElement {

    declare root:SVGScriptElement;

    /**
    * Constructs a new sript element.
    */
  constructor() {
    let title = document.createElementNS( 'http://www.w3.org/2000/svg', 'script');
    super(title);
  }

    // comments inherited from base class
    setAttribute( name:ScriptAttributes | CoreAttributes, value:string ) {
        this.root.setAttribute(name,value);
        return this;
    }

    // comments inherited from base class
    getAttribute( name:ScriptAttributes | CoreAttributes) : string {
        return this.root.getAttribute(name);
    }
}
