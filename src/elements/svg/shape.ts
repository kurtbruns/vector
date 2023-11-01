import { BaseElement, CoreAttributes, PresentationAttributes } from './base-element'
import { Definitions } from './definitions';

/**
* Attributes associated with geometric SVG elements.
*/
export type ShapeAttributes = 'marker-start' | 'marker-mid' | 'marker-end' | 'transform' | 'vector-effect';

/**
* A shape is a basic geometric element.
*/
export abstract class Shape extends BaseElement {

  // make the type of the root more specific
  root:SVGGeometryElement;

  /**
  * Constructs a shape element with the provided root.
  */
  constructor( root:SVGGeometryElement ) {
    super(root);
  }
  
  // comment inherited from base class
  setAttribute(name: ShapeAttributes | PresentationAttributes | CoreAttributes, value: string): Shape {
    this.root.setAttribute(name,value);
    return this;
  }

  // comment inherited from base class
  getAttribute(name: ShapeAttributes | PresentationAttributes | CoreAttributes): string {
    return this.root.getAttribute(name);
  }

  /**
  * Returns the location of the point on the path.
  */
  getPointAtLength(x:number) : DOMPoint {
    return this.root.getPointAtLength(x);
  }

  /**
  * Returns the total length of this path.
  */
  getTotalLength() : number {
    return this.root.getTotalLength();
  }

  /**
  * Returns true if the point is contained within this shapes fill
  */
  isPointInFill( point:DOMPoint ) {
    return this.root.isPointInFill(point);
  }

  /**
  * Returns true if the point is contained within this shapes stroke
  */
  isPointInStroke( point:DOMPoint ) {
    return this.root.isPointInStroke(point);
  }

  /**
   * Attaches an arrow to the start or end of the path.
   */
    attatchArrow(defs: Definitions, start: boolean = true, color?:string) {
      if (defs === undefined) {
          throw new Error(`Undefined definitions: ${this}`);
      }
    
      if (!color) {
        // color = window.getComputedStyle(this.root).stroke;
        color = 'var(--font-color)';
      }

      // TODO: optimize and lookup and reuse for later 
      const id = `arrow${defs.root.children.length+1}`;
      defs.root.innerHTML += `<marker id="${id}" refX="10" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M 0 0.5 L 10 5 L 0 9.5 L 2 5 z" fill="${color}" stroke="none"></path></marker>`;
    
      // Compute the length of the path.
      let pathLength = this.getTotalLength();
    
      // Determine the gap size before the arrowhead.
      let gapSize = 5;
  
      // Compute the visible part of the stroke.
      let visibleStroke = pathLength - gapSize;
    
      // Adjust the stroke-dasharray based on whether the arrow is at the start or end.
      if (start) {
          this.setAttribute('marker-start', `url(#${id})`);
          // this.setAttribute('stroke-dasharray', `${gapSize} ${visibleStroke}`);
      } else {
          this.setAttribute('marker-end', `url(#${id})`);
          // this.setAttribute('stroke-dasharray', `${visibleStroke} ${gapSize}`);
      }
    }
}
