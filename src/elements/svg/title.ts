import { BaseElement } from "./base-element";

export class Title extends BaseElement {
  constructor() {
    let title = document.createElementNS( 'http://www.w3.org/2000/svg', 'title');
    super(title);
  }
}
