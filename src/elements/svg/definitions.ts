import { Marker } from '../../index';
import { BaseElement } from './base-element'

export class Definitions extends BaseElement {
  constructor() {
    let defs = document.createElementNS( 'http://www.w3.org/2000/svg', 'defs');
    super(defs);
  }

  marker( refX:number, refY:number, width:number, height:number ) {
    return this.appendChild(new Marker(refX, refY, width, height));
  }
}
