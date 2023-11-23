import { BaseNode } from './node';

/**
* A point has an x position and y position
*/
export class Point extends BaseNode {

    x: number;
    y: number;

    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;
    }

    /**
     * Shifts this point one way or the other.
     */
    shift(other: Point) : Point {
        this.x += other.x;
        this.y += other.y;
        this.updateDependents();
        return this;
    }

    /**
     * Dot product of this point with another point
     */ 
    dot(other: Point): number {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * Multiplies this point by a scalar
     */
    multiply(scalar: number): Point {
        return new Point(this.x * scalar, this.y * scalar);
    }

    /**
     * Moves the point to the provided coordinates as a point
     */
    moveTo(p:{x:number, y:number}): Point;

    /**
     * Moves the point to the provided x and y coordinates
     */
    moveTo(x:number, y:number): Point;

    // moveTo method implementation
    moveTo(xOrP:number | {x:number, y:number}, y?:number): Point {
        if (typeof xOrP === 'object') {
            // When the first argument is an object with x and y properties
            this.x = xOrP.x;
            this.y = xOrP.y;
        } else {
            // When the first argument is a number, and the second argument is provided
            if (y === undefined) {
                throw new Error('y must be provided when x is a number');
            }
            this.x = xOrP;
            this.y = y;
        }

        this.updateDependents();

        return this;
    }

    get animate() {
        const context : Point = this;
    
        return {
            moveTo: function (endPoint:{x:number, y:number}) {
                let hasStarted = false;
                let startX;
                let startY;
    
                return (alpha) => {
                    if (!hasStarted) {
                        startX = context.x;
                        startY = context.y;
                        hasStarted = true;
                    }
                    context.x = startX + (endPoint.x - startX) * alpha;
                    context.y = startY + (endPoint.y - startY) * alpha;
                    context.updateDependents();
                };
            },
        };
    }
}