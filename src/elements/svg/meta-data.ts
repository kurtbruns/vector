import { BaseElement } from "./base-element";

export class MetaData extends BaseElement {
  constructor() {
    let metadata = document.createElementNS( 'http://www.w3.org/2000/svg', 'metadata');
    super(metadata);
  }
}
