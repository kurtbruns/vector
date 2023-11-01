import { BaseElement } from './base-element'

export class Description extends BaseElement {
  constructor() {
    let desc = document.createElementNS( 'http://www.w3.org/2000/svg', 'desc');
    super(desc);
  }
}
