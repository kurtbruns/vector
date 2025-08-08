import { BaseElement, CoreAttributes, PresentationAttributes } from './base-element'
import { Structural, Shape, Descriptive } from './content-model'

import { A } from './a'
import { Circle } from './circle'
import { ClipPath } from './clip-path'
import { Definitions } from './definitions'
import { Ellipse } from './ellipse'
import { Line } from './line'
import { Path } from './path'
import { Polygon } from './polygon'
import { Rectangle } from './rectangle'
import { Symbol } from './symbol'
import { SVG } from './svg'
import { Text } from './text'
import { Title } from './title'
import { Use } from './use'
import { Description } from './description'
import { MetaData } from './meta-data'

export type GroupAttributes = 'clip-path' | 'transform';

/**
* A group is a structural element that allows for elements to be grouped
* together and have styles and transformations applied to the elements in the
* group.
*/
export class Group extends BaseElement implements Descriptive, Shape, Structural {


    // make the type of the root to be more specific
    declare root: SVGGElement;

    /**
    * Constructs a rectangle element at the position (x,y)
    */
    constructor() {
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        super(group);
    }

    get animate() {
        return {
            setOpacity: (value:number)  => {
                let hasStarted = false;
                let startValue;    
                return (alpha) => {
                    if (!hasStarted) {
                        startValue = parseFloat(this.getAttribute('opacity'));
                        if(isNaN(startValue)) {
                            startValue = 1;
                        }
                        hasStarted = true;
                    }
                    const opacity = startValue + (value - startValue)*alpha;
                    this.setAttribute('opacity', opacity.toFixed(3)) 
                };
            },
        };
    }

    // comment inherited from base class
    setAttribute(name: GroupAttributes | CoreAttributes | PresentationAttributes, value: string): Group {
        this.root.setAttribute(name, value);
        return this;
    }

    // comment inherited from base class
    getAttribute(name: GroupAttributes | CoreAttributes | PresentationAttributes): string {
        return this.root.getAttribute(name);
    }

    // Descriptive methods

    description(): Description {
        return this.appendChild(new Description());
    }
    metadata(): MetaData {
        return this.appendChild(new MetaData());
    }
    title(): Title {
        return this.appendChild(new Title());
    }

    // Structural methods

    defs(): Definitions {
        return this.appendChild(new Definitions());
    }
    group(): Group {
        return this.appendChild(new Group());
    }
    svg(width: number, height: number): SVG {
        return this.appendChild(new SVG(width, height));
    }
    symbol(): Symbol {
        return this.appendChild(new Symbol());
    }
    use(x: number, y: number, width: number, height: number): Use {
        return this.appendChild(new Use(x, y, width, height));
    }

    // Shape methods

    circle(cx: number, cy: number, r: number): Circle {
        return this.appendChild(new Circle(cx, cy, r));
    }
    ellipse(cx: number, cy: number, rx: number, ry: number): Ellipse {
        return this.appendChild(new Ellipse(cx, cy, rx, ry));
    }
    line(x1: number, y1: number, x2: number, y2: number): Line {
        return this.appendChild(new Line(x1, y1, x2, y2));
    }
    path(d: string = '' ): Path {
        return this.appendChild(new Path(d));
    }
    polygon(points: string): Polygon {
        return this.appendChild(new Polygon(points));
    }
    rectangle(x: number, y: number, width: number, height: number): Rectangle {
        return this.appendChild(new Rectangle(x, y, width, height));
    }

    // other methods

    /**
     * Set the opacity of the group
     * @param value - The opacity value to set (0-1)
     */
    setOpacity(value: number) {
        this.root.setAttribute('opacity', value.toString());
    }

    /**
    * Constructs and appends a text element within this element.
    */
    text(x: number, y: number, str: string): Text {
        return this.appendChild(new Text(x, y, str));
    }

    /**
    * Constructs and appends an 'a' (link) within this element.
    */
    a(href: string): A {
        return this.appendChild(new A(href));
    }

    /**
    * Constructs and appends a clipPath within this element
    */
    clipPath(): ClipPath {
        return this.appendChild(new ClipPath());
    }

}
