import { BaseNode } from '../..';

/**
* These global attributes are associated with every SVG element in the DOM.
*/
export type CoreAttributes = 'id' | 'tabindex' | 'style' | 'class' | 'lang' | 'autofocus' | 'xml:space' | 'transform';

/**
* Presentation attributes for SVG elements
*/
export type PresentationAttributes = 'clip-path' | 'clip-rule' | 'color' | 'color-interpolation' | 'cursor' | 'display' | 'fill' | 'fill-opacity' | 'fill-rule' | 'filter' | 'mask' | 'opacity' | 'pointer-events' | 'shape-rendering' | 'stroke' | 'stroke-dasharray' | 'stroke-dashoffset' | 'stroke-linecap' | 'stroke-linejoin' | 'stroke-miterlimit' | 'stroke-opacity' | 'stroke-width' | 'transform' | 'vector-effect' | 'visibility';

/**
* This class defines the basic shape for all SVG elements within our library.
*/
export class BaseElement extends BaseNode {

  /**
  * The root element of this element.
  */
  root: SVGElement;

  /**
  * Style for the root element.
  */
  style: CSSStyleDeclaration;

  /**
  * Class attribute for the root element.
  */
  classList: DOMTokenList;

  // TODO: tranform object/property?

  /**
  * Constructs the element and adds it into the current controller.
  */
  constructor(root: SVGElement) {

    super();
    this.root = root;

    BaseNode.controller.add(this)

    // make the root's style declaration available
    this.style = this.root.style;
    this.classList = this.root.classList;
  }

  /**
  * Sets the provided attribute with the value. WARNING: Elements are given
  * a unique id by default. Changing the id may have unintended consequences.
  * Similarily, the style and class attributes should be accessed through the
  * properties "style" and "classList".
  */
  setAttribute(name: CoreAttributes, value: string): BaseElement {
    this.root.setAttribute(name, value);
    return this;
  }

  /**
  * Returns the value associated with the attribute.
  */
  getAttribute(name: CoreAttributes): string {
    return this.root.getAttribute(name);
  }

  /**
  * Appends the element as a child within this element.
  */
  appendChild<T extends BaseElement>(child: T): T {
    this.root.appendChild(child.root);
    return child;
  }

  /**
  * Inserts the element before the first child within this element.
  */
  prependChild<T extends BaseElement>(child: T): T {
    this.root.prepend(child.root);
    return child;
  }

  /**
  * Returns true if this element contains the argument element.
  */
  contains(element: BaseElement) {
    return this.root.contains(element.root);
  }

  /**
  * Removes this element from the DOM and from the Element controller.
  */
  remove() {
    BaseNode.controller.remove(this);
    this.root.remove();
  }

  /**
   * Appends self within the corresponding element
   */
  appendSelfWithin(container: Element): Element {
    container.appendChild(this.root);
    return container;
  }

  /**
  * Returns the bounding box of this element. Note, this is different from the
  * getBoundingClientRect method since the bounding box is affected by the
  * current viewPort.
  *
  * If this element's root is not a SVGGraphics element as is the case for the
  * marker, title, and more element, then null is returned instead of a DOMRect.
  */
  getBoundingBox(): SVGRect {
    if (this.root instanceof SVGGraphicsElement) {
      return this.root.getBBox();
    } else {
      return null;
    }
  }
}
