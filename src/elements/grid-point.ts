import { Point } from '../model';
import { PlotGridBased } from '../modules/plot';
import { TAU } from '../util/math';
import { Input } from './input'
import { Circle } from './svg';
/**
* A control point is a draggable two dimensional point.
*/
export class GridPoint extends Input {

    // Describes the size of the control handle and point
    private static pointRadius: number = 3.5;
    private static handleRadius: number = 13;

    // Keeps track of the active control and the error in the user's click
    private static active: GridPoint = null;
    private static slopX: number = 0;
    private static slopY: number = 0;
    private static prevX: number = 0;
    private static prevY: number = 0;
    private static closestSVG: SVGSVGElement;
    private static ctm: DOMMatrix;

    // Private instance variables
    private _x: number;
    private _y: number;
    private _dx: number;
    private _dy: number;

    // Keep track of whether global event listeners have been initialized
    private static initalized = false;

    /**
    * Allows for the events attatched to elements to be disabled.
    */
    static disable: boolean = false;

    private grid: PlotGridBased;

    // Svg elements that make up the control
    point: Circle;
    handle: Circle;

    /**
    * Modifying the transform function allows for the control to be constrained
    * to a path or constrained to the region enclosed in a path.
    */
    constrain = function (_oldPosition: Point, newPosition: Point): Point {
        return newPosition;
    };

    /**
    * Constructs a control at the position (x,y) in the provided grid
    */
    constructor(grid: PlotGridBased, x: number, y: number) {
        super();

        // create the svg components
        this.point = this.circle(0, 0, GridPoint.pointRadius);
        this.handle = this.circle(0, 0, GridPoint.handleRadius);
        this.point.classList.add('point');
        this.handle.classList.add('handle');
        this.root.classList.add('control');

        this.grid = grid;

        // initialize instance variables
        this._x = x;
        this._y = y;
        this._dx = 0;
        this._dy = 0;

        this.update = () => { };

        // translate the control to its initial position
        let relativePoint = this.grid.SVGToRelative(this._x, -this._y);
        console.log(x, y, relativePoint)
        this.moveTo(relativePoint.x - 540, relativePoint.y);

        // register event handlers
        this.root.onmousedown = this.handleMouseDown.bind(this);
        this.handle.root.onmouseout = this.handleMouseOut.bind(this);
        this.handle.root.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });

        // initialize window event listeners only once
        if (!GridPoint.initalized) {
            window.onmouseover = GridPoint.handleMouseOver;
            window.onmousemove = GridPoint.handleMouseMove;
            window.onmouseup = GridPoint.handleInputEnd;
            window.addEventListener('touchend', GridPoint.handleInputEnd, { passive: false });
            window.addEventListener('touchmove', GridPoint.handleTouchMove, { passive: false });
            GridPoint.initalized = true;
        }
    }

    /**
    * Handles when the user moves their mouse over the window. If there is an
    * active control, the control's position is updated.
    */
    static handleMouseMove(event: MouseEvent) {
        if (GridPoint.active != null) {
            GridPoint.handleMoveTo(event.clientX, event.clientY);
            event.preventDefault();
        }
    }

    /**
    * Handles a touch move eveznt. If there is an active control, the control's
    * position is updated.
    */
    static handleTouchMove(event: TouchEvent) {
        if (GridPoint.active != null) {
            GridPoint.handleMoveTo(event.touches[0].clientX, event.touches[0].clientY);
            event.preventDefault();
        }
    }

    /**
    * Moves the active control to the new (x,y) position.
    */
    static handleMoveTo(clientX: number, clientY: number) {

        // Calculate the position of (clientX, clientY) in the SVG coordinate system
        let point = GridPoint.closestSVG.createSVGPoint();
        point.x = clientX;
        point.y = clientY;
        let p = point.matrixTransform(GridPoint.ctm.inverse());

        // Update the current position of the control point
        let x = p.x + GridPoint.slopX;
        let y = p.y + GridPoint.slopY;
        GridPoint.active.moveTo(x, y);
    }

    /**
     * Converts this control point to a black/white point for display / printing.
     */
    converToDisplay() {
        this.point.fill = '#404040';
        this.point.r = 3.5;
    }

    /**
    * Handles when a use mouses up over the window or ends their touch event.
    */
    static handleInputEnd(event: TouchEvent | MouseEvent) {
        if (GridPoint.active != null) {

            // remove highlighting from the active control and set to null
            GridPoint.active.handle.root.classList.remove('highlight');
            GridPoint.active = null;

            // fire a mouseover event to highlight either: an interactive control,
            // the recently active control, or a different element entirely.
            // Currently, whichever element is highest in the DOM order will be the
            // target. In the future the most recently active Control could be
            // prioritized for user experience.
            if (event.type != "touchend") {
                event.target.dispatchEvent(new MouseEvent('mouseover', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                }));
            }
        }
    }

    /**
    * When a user mouses over a control, add the class "highlight" to the control
    * handle.
    */
    static handleMouseOver(event: MouseEvent) {
        let target = (event.target as HTMLElement);
        if (GridPoint.active == null && !GridPoint.disable && target.tagName == 'circle' && target.classList.contains('handle')) {
            (event.target as HTMLElement).classList.add('highlight');
        }
    }

    /**
    * When a user mouses out of a control handle and when there is no active
    * control, remove the "highlight" class from the event target.
    */
    handleMouseOut(event: MouseEvent) {
        if (GridPoint.active == null) {
            (event.target as HTMLElement).classList.remove('highlight');
        }
    }

    /**
    * Handle when a user mouses down over a Control's handle. Stores the error in
    * the user's click as well as stores which Control the user is clicking.
    */
    handleMouseDown(event: MouseEvent) {
        if (!GridPoint.disable) {
            event.preventDefault();
            event.stopPropagation();
            GridPoint.active = this;

            // Store the parent SVG coordinate system
            GridPoint.closestSVG = GridPoint.active.root.closest('svg');
            GridPoint.ctm = GridPoint.closestSVG.getScreenCTM();

            // Calculate the (x,y) position of (clientX, clientY)
            let point = GridPoint.closestSVG.createSVGPoint();
            point.x = event.clientX;
            point.y = event.clientY;
            let p = point.matrixTransform(GridPoint.ctm.inverse());

            // Store the difference between the mouse position and the control position
            GridPoint.slopX = GridPoint.active.x - p.x;
            GridPoint.slopY = GridPoint.active.y - p.y;
        }
    }

    /**
    * Handle when a user touches over a Control's handle. Stores the error in
    * the user's input as well as stores which Control the user is clicking.
    */
    handleTouchStart(event: TouchEvent) {
        if (!GridPoint.disable) {
            GridPoint.active = this;
            // Store the parent SVG coordinate system
            GridPoint.closestSVG = GridPoint.active.root.closest('svg');
            GridPoint.ctm = GridPoint.closestSVG.getScreenCTM();

            // Calculate the (x,y) position of (clientX, clientY)
            let point = GridPoint.closestSVG.createSVGPoint();
            point.x = event.touches[0].clientX;
            point.y = event.touches[0].clientY;
            let p = point.matrixTransform(GridPoint.ctm.inverse());

            // Store the difference between the mouse position and the control position
            GridPoint.slopX = GridPoint.active.x - p.x;
            GridPoint.slopY = GridPoint.active.y - p.y;
            event.preventDefault();
        }
    }

    // Getter function that returns an object with moveTo method
    get animate() {
        // The context for `this` is stored to be used in the returned function below
        const context = this;

        return {
            // The moveTo method takes another Point instance as the end point
            moveTo: function (endPoint: Point) {
                const startX = context.x;
                const startY = context.y;
                const endX = endPoint.x;
                const endY = endPoint.y;

                // The returned function interpolates the point's position to the end point's position
                return (alpha: number) => {
                    context.x = startX + (endX - startX) * alpha;
                    context.y = startY + (endY - startY) * alpha;
                    context.updateDependents();
                };
            },
        };
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
        this.y += s;
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
     * Method to convert the point to a string.
     */
    toString(): string {
        return `${this.x} + ${this.y}i`;
    }

    /**
     * Returns a copy of this point.
     */
    copy(): Point {
        return new Point(this.x, this.y);
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
        let tempX;
        let tempY;
        if (typeof xOrP === 'object') {
            // When the first argument is an object with x and y properties
            tempX = xOrP.x;
            tempY = xOrP.y;
        } else {
            // When the first argument is a number, and the second argument is provided
            if (y === undefined) {
                throw new Error('y must be provided when x is a number');
            }
            tempX = xOrP;
            tempY = y;
        }

        // call the internal transform function
        let point = this.constrain(this, new Point(tempX, tempY));

        // update the instance data
        this._dx = point.x - this._x;
        this._dy = point.y - this._y;
        this._x = point.x;
        this._y = point.y;

        // transform the position of the contorl
        this.root.setAttribute('transform', `translate( ${this.x}, ${this.y})`);

        // call the onchange function
        this.onchange();

        return this;
    }

    /**
    * Updates the x position of the control.
    */
    set x(x: number) {
        this._dx = x - this.x;
        this._x = x;
        this.root.setAttribute('transform', 'translate( ' + this.x + ', ' + this.y + ')');
    }

    /**
    * Updates the y position of the control.
    */
    set y(y: number) {
        this._dy = y - this.y;
        this._y = y;
        this.root.setAttribute('transform', 'translate( ' + this.x + ', ' + this.y + ')');
    }

    /**
    * Gets the x position of the control.
    */
    get x() {
        return this._x;
    }

    /**
    * Gets the y position of the control.
    */
    get y() {
        return this._y;
    }

    /**
    * Gets the change in x position of this control.
    */
    get dx() {
        return this._dx;
    }

    /**
    * Gets the change in y position of this control.
    */
    get dy() {
        return this._dy;
    }

    /**
     * Returns the angle in radians relative to the origin that the point forms.
     * TODO: the y-axis is flipped on this because it would be a pain to always
     * negate the angle. In the future probably implement a custom language and
     * then choose an output and do the inversion there.
     */
    get displayAngle() {
        if (this.y <= 0) {
            return Math.abs(Math.atan2(this.y, this.x));
        } else {
            return TAU - Math.atan2(this.y, this.x);
        }
    }

    /**
    * Returns the angle in radians relative to the origin that the point forms.
    */
    get angle() {

        return (Math.atan2(this.y, this.x) + TAU) % TAU;

    }


}
