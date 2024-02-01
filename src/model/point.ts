import { BaseNode } from './node';

/**
* A point has an x position and y position
*/
export class Point extends BaseNode {

    x: number;
    y: number;

    /**
     * Constructs a new point
     */
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }

    /**
     * Yields the components of the point.
     */
    *[Symbol.iterator]() {
        yield this.x;
        yield this.y;
    }

    /**
     * Multiplies this point by a scalar and returns a new point.
     */
    scale(s: number): Point {
        this.x *= s;
        this.y *= s;
        this.updateDependents();
        return this;
    }

    /**
     * Shifts this point one way or the other.
     */
    shift(other: Point): Point {
        this.x += other.x;
        this.y += other.y;
        this.updateDependents();
        return this;
    }

    /**
     * Calculates the length of this vector.
     * 
     * @returns The length of the vector.
     */
    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Normalizes the vector, resulting in a unit vector.
     * 
     * @returns A new Vector3 representing the normalized vector.
     */
    normalize(): Point {
        let length = this.length();
        return new Point(this.x / length, this.y / length);
    }

    /**
     * Dot product of this point with another point
     */
    dot(other: Point): number {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * Cross product of this point with another point
     */
    cross(other: Point): number {
        return this.x * other.y - this.y * other.x;
    }

    /**
     * Method to add two points
     */
    add(other: Point): Point {
        return new Point(this.x + other.x, this.y + other.y);
    }

    /**
     * Method to subtract two points
     */
    subtract(other: Point): Point {
        return new Point(this.x - other.x, this.y - other.y);
    }

    /**
     * Multiply two points together using complex multiplication.
     */
    multiply(other: Point): Point {
        let xPart = this.x * other.x - this.y * other.y;
        let yPart = this.x * other.y + this.y * other.x;
        return new Point(xPart, yPart);
    }

    /**
     * Divides two points together using complex division.
     */
    divide(other: Point): Point {
        return this.multiply(other.conjugate()).scale(1 / other.multiply(other.conjugate()).x);
    }

    /**
     * Returns the conjugate of the point.
     */
    conjugate(): Point {
        return new Point(this.x, -this.y);
    }

    /**
     * Returns a copy of this point.
     */
    copy(): Point {
        return new Point(this.x, this.y);
    }

    /**
     * Method to convert the point to a string.
     */
    toString(): string {
        return `${this.x} + ${this.y}i`;
    }

    /**
     * Moves the point to the provided coordinates as a point
     */
    moveTo(p: { x: number, y: number }): Point;

    /**
     * Moves the point to the provided x and y coordinates
     */
    moveTo(x: number, y: number): Point;

    // moveTo method implementation
    moveTo(xOrP: number | { x: number, y: number }, y?: number): Point {
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
        const context: Point = this;

        return {
            moveTo: function (endPoint: { x: number, y: number }) {
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