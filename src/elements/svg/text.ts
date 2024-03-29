import { BaseElement, CoreAttributes, PresentationAttributes } from './base-element'
import { TSpan } from './t-span'
import { Typography } from './content-model'

/**
* These attributes control the text position.
*/
export type TextAttributes = 'baseline-shift' | 'dominant-baseline' | 'text-align' | 'alignment-baseline' | 'text-anchor'  ;

type StylingAttributes = 'font-family' | 'font-size' | 'font-size-adjust' | 'font-stretch' | 'font-style' | 'font-variant' | 'font-weight';

/**
* Text is a basic element containing string contents
*/
export class Text extends BaseElement implements Typography {

  // make the type of the root to be more specific
  declare root: SVGTextElement;

  /**
  * Constructs text at the position (x,y) with the provided string
  */
  constructor( x:number, y:number, str:string = '' ) {
    let text = document.createElementNS( 'http://www.w3.org/2000/svg', 'text');
    text.setAttributeNS(null, 'x', x.toString());
    text.setAttributeNS(null, 'y', y.toString());
    if( str != undefined ) { text.innerHTML = str; }
    super(text);
  }

  // comment inherited from base class
  setAttribute(name: TextAttributes | StylingAttributes | CoreAttributes | PresentationAttributes, value: string): Text {
    this.root.setAttribute(name,value);
    return this;
  }

  // comment inherited from base class
  getAttribute(name: TextAttributes | StylingAttributes | CoreAttributes | PresentationAttributes): string {
    return this.root.getAttribute(name);
  }

  /**
  * Sets the contents of this element
  */
  set contents( str:string) {
    this.root.innerHTML = str;
  }

  /**
  * Sets the contents of this element
  */
  get contents() {
    return this.root.innerHTML;
  }

  /**
  * Gets the x position of this element
  */
  get x() {
    return Number(this.root.getAttribute('x'));
  }

  /**
  * Gets the y position of this element
  */
  get y() {
    return Number(this.root.getAttribute('y'));
  }

  /**
  * Sets the x position of this element
  */
  set x( value:number ) {
    this.root.setAttribute('x', value.toString());
  }

  /**
  * Sets the y position of this element
  */
  set y( value:number ) {
    this.root.setAttribute('y', value.toString());
  }

  /**
  * Returns the length of the text
  */
  get length() : number {
    const context = document.createElement("canvas").getContext("2d");
    return context.measureText(this.root.innerHTML).width;
  }

  text( x: number, y: number, str:string ) : Text {
    let text = new Text(x,y,str);
    this.root.appendChild(text.root);
    return text;
  }

  tspan( text:string = '') : TSpan {
    let tspan = new TSpan(text);
    this.root.appendChild(tspan.root);
    return tspan;
  }
}
