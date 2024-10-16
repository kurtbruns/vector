import { Circle, TAU } from "../.."
import { Frame, Tex } from "../../elements"
import { Group, Line, Path, Rectangle, SVG } from "../../elements/svg"
import { Point } from "../../model"
import { Brace } from "./Brace";

/**
 * Configuration when creating a plot.
 */
export interface PlotConfig {

    /**
     * The x-coordinate of the plot's frame
     */
    x?: number

    /**
     * The y-coordinate of the plot's frame.
     */
    y?: number

    /**
     * The width of the plot's frame.
     */
    width?: number

    /**
     * The height of the plot's frame.
     */
    height?: number

    /**
     * The x-coordinate of the bottom left corner of the viewport.
     */
    viewportX?: number

    /**
     * The y-coordinate of the bottom left corner of the viewport.
     */
    viewportY?: number

    /**
     * The width of the viewport.
     */
    viewportWidth?: number

    /**
     * The height of the viewport.
     */
    viewportHeight?: number

    /**
     * Draws a border for the plot.
     */
    drawBorder?: boolean

}

type FunctionType = (x: number) => number;

/**
 * A plot for drawing the curves formed by functions
 * 
 * TODO: the frame vs. viewport vs. internal coordiantes
 */
export class Plot {

    /**
     * The root element that contains the frame, foreground,e tc.
     */
    root: Group;

    /**
     * The viewport of the plot.
     */
    frame: Frame

    /**
     * Array of functions paths
     */
    paths: Path[];

    /**
     * Array of functions
     */
    functions: FunctionType[];

    /**
     * The group (layer) used to place the path above the grid and such
     */
    fnGroup: Group;

    /**
     * Contains the grid lines
     */
    grid: Group;

    /**
     * Contains the axis lines
     */
    axes: Group;

    /**
     * Contains the labels for the plot
     */
    labels: Group;

    /**
     * Foreground
     */
    foreground: Group;

    /**
     * 
     */
    borderGroup: Group;

    /**
     * 
     */
    backgroundRectangle: Rectangle;

    /**
     * The current transformatio matrix which maps the local coordinate system of an SVG element to the coordinate system of the screen
     */
    private ctm: DOMMatrix;

    /**
     * The inverse of the current transformatio matrix.
     */
    private inverse: DOMMatrix;

    /**
     * The bounding client rectangle of the frame excluding overflow.
     */
    private bbox: DOMRect;

    /**
     * Nested SVG to fix firefox bug with viewbox
     */
    private internalSVG: SVG;

    /**
     * The internal viewBox used for calculating the range and domain of the viewBox.
     */
    private internalViewBox: SVGAnimatedRect;

    /**
     * Contructs a SVG plot within the corresponding HTML Element and draws a plot of the function.
     */
    constructor(container: Frame | Group, config: PlotConfig = {}) {

        // Default values 
        let defaultConfig: PlotConfig = {

            // frame dimensions
            x: 0,
            y: 0,
            width: 600,
            height: 300,

            // viewport dimensions
            viewportX: -300,
            viewportY: -150,
            viewportWidth: 600,
            viewportHeight: 300,
        }

        // choose users config over default
        config = { ...defaultConfig, ...config };

        this.root = container.group();
        this.root.setAttribute('transform', `translate(${config.x}, ${config.y})`)

        config.x = 0;
        config.y = 0;
        this.frame = new Frame(this.root.root, config);

        // convert to internal coordinates
        let svgX = config.viewportX;
        let svgY = -config.viewportY - config.viewportHeight;
        let svgWidth = config.viewportWidth;
        let svgHeight = config.viewportHeight;

        let svg = this.frame.appendChild(new SVG());
        svg.classList.add('ignore-on-export')
        svg.setAttribute('viewBox', `${svgX} ${svgY} ${svgWidth} ${svgHeight}`);

        this.internalViewBox = svg.root.viewBox;

        // Store a reference to fix firefox viewbox issue
        if (navigator.userAgent.indexOf("Firefox") > -1) {
            this.internalSVG = svg.appendChild(new SVG());
        } else {
            this.internalSVG = svg as SVG;
        }

        this.grid = this.frame.background.group();

        // This is strange because its dipping into the coordinate system of the parent, but makes importing into Figma nicer
        this.foreground = this.root.group();

        this.backgroundRectangle = svg.rectangle(svgX, svgY, svgWidth, svgHeight);
        this.backgroundRectangle.style.fill = 'transparent';
        this.backgroundRectangle.stroke = 'none';

        this.fnGroup = this.foreground.group();
        this.fnGroup.classList.add('non-scaling-stroke')
        this.fnGroup.setAttribute('stroke', 'var(--font-color)');
        this.fnGroup.setAttribute('stroke-width', '1.5px');
        this.paths = [];
        this.functions = [];

        this.frame.setAttribute('preserveAspectRatio', 'none');

        this.borderGroup = this.foreground.group();
        this.axes = this.foreground.group();
        this.labels = this.foreground.group();


    }

    /**
     * Retrieves the current transformation matrix that maps the local coordinate system of an SVG element to the coordinate system of the screen.
     * 
     * @returns The current transformation matrix.
     */
    getCTM() {
        if (!this.ctm) {
            this.ctm = this.internalSVG.root.getScreenCTM();
        }

        return this.ctm;
    }

    /**
     * Initializes the current transformation matrix.
     */
    setCTM() {
        this.getCTM();
    }

    releaseCTM() {
        this.ctm = null;
        this.inverse = null;
    }

    /**
     * Retrieves the inverse of the current transformation matrix.
     * 
     * @returns The inverse of the current transformation matrix.
     */
    getInverse() {
        if (!this.inverse) {
            this.inverse = this.getCTM().inverse();
        }

        return this.inverse;
    }

    /**
     * 
     * @returns The bounding rectangle of the frame, ignoring overflow.
     */
    getFrameBoundingRect(): DOMRect {
        if (!this.bbox) {
            this.bbox = this.backgroundRectangle.root.getBoundingClientRect();
        }

        return this.bbox;
    }

    /**
     * Initializes the bounding rectangle of the frame.
     */
    setBoundingRect(): void {
        this.getFrameBoundingRect();
    }

    releaseBoundingRect() {
        this.bbox = null;
    }

    /**
     * 
     * @returns The smallest y-value of the SVG
     */
    getSVGMinY() {
        let viewBox = this.internalViewBox.baseVal;
        return viewBox.y;
    }

    /**
     * 
     * @returns The largest y-value of the SVG
     */
    getSVGMaxY() {
        let viewBox = this.internalViewBox.baseVal;
        return viewBox.y + viewBox.height;
    }

    /**
     * 
     * @returns The smallest x-value of the SVG
     */
    getSVGMinX() {
        let viewBox = this.internalViewBox.baseVal;
        return viewBox.x;
    }

    /**
     * 
     * @returns The smallest y-value of the SVG
     */
    getSVGMaxX() {
        let viewBox = this.internalViewBox.baseVal;
        return viewBox.x + viewBox.width;
    }

    /**
     * Converts a point in the screen's coordinate system into the SVG's coordinate system
     */
    screenToSVG(screenX: number, screenY: number): DOMPoint {

        let svg = this.internalSVG.root;
        let p = svg.createSVGPoint();
        p.x = screenX;
        p.y = screenY;

        let point = p.matrixTransform(this.getInverse())
        return point;
    }

    /**
     * Converts a point in the screen's coordinate system into the SVG's coordinate system
     */
    screenToViewport(screenX: number, screenY: number): DOMPoint {

        let svg = this.internalSVG.root;
        let p = svg.createSVGPoint();
        p.x = screenX;
        p.y = screenY;

        let point = p.matrixTransform(this.getInverse())
        point.y = - point.y;
        return point;
    }

    relativeToViewport(relativeX: number, relativeY: number): DOMPoint;
    relativeToViewport(point: { x: number, y: number }): DOMPoint;
    relativeToViewport(relativeXOrPoint: number | { x: number, y: number }, relativeY?: number) {

        // Determine if the first argument is a point object or a number
        let relative = typeof relativeXOrPoint === 'number' ? { x: relativeXOrPoint, y: relativeY } : relativeXOrPoint;

        // First, we need to find the absolute position on the screen
        let bbox = this.getFrameBoundingRect();

        // Add the bounding box's top left corner to get to absolute screen coordinates
        let absoluteScreenX = relative.x + bbox.left;
        let absoluteScreenY = relative.y + bbox.top;

        // Now we can use the screenToSVG method to convert to SVG coordinates
        return this.screenToViewport(absoluteScreenX, absoluteScreenY);
    }


    /**
     * Overload signature for converting point from x and y number parameters.
     * @param relativeX The x-coordinate relative to the SVG element.
     * @param relativeY The y-coordinate relative to the SVG element.
     * @returns Converted point in the SVG's coordinate system.
     */
    relativeToSVG(relativeX: number, relativeY: number): DOMPoint;

    /**
     * Overload signature for converting point from a point object parameter.
     * @param point An object with properties x and y, specifying the coordinates relative to the SVG element.
     * @returns Converted point in the SVG's coordinate system.
     */
    relativeToSVG(point: { x: number, y: number }): DOMPoint;

    /**
     * Converts a point from relative screen coordinates to the SVG's coordinate system.
     * It assumes that the point is given in coordinates relative to the same origin
     * used by the SVG's getBoundingClientRect (typically the top-left of the SVG element).
     */
    relativeToSVG(relativeXOrPoint: number | { x: number, y: number }, relativeY?: number) {

        // Determine if the first argument is a point object or a number
        let relative = typeof relativeXOrPoint === 'number' ? { x: relativeXOrPoint, y: relativeY } : relativeXOrPoint;

        // First, we need to find the absolute position on the screen
        let bbox = this.getFrameBoundingRect();

        // Add the bounding box's top left corner to get to absolute screen coordinates
        let absoluteScreenX = relative.x + bbox.left;
        let absoluteScreenY = relative.y + bbox.top;

        // Now we can use the screenToSVG method to convert to SVG coordinates
        return this.screenToSVG(absoluteScreenX, absoluteScreenY);
    }
    /**
     * Converts a point in the SVG's coordinate system to the *absolute* screen coordindate
     */
    private SVGToScreen(svgX: number, svgY: number) {

        let svg = this.internalSVG.root;
        let p = svg.createSVGPoint()
        p.x = svgX
        p.y = svgY
        return p.matrixTransform(this.getCTM());
    }

    viewportToSVG(viewportX: number, viewportY: number): Point;
    viewportToSVG(viewportPoint: { x: number, y: number }): Point;
    viewportToSVG(viewportXOrPoint: number | { x: number, y: number }, viewportY?: number): Point {

        // Implementation detail: Determine argument type and assign appropriate point values
        let pointToUse: Point | { x: number, y: number };

        if (typeof viewportXOrPoint === "number" && viewportY !== undefined) {
            // If arguments are numbers, construct a point using them
            pointToUse = { x: viewportXOrPoint, y: viewportY };
        } else if (typeof viewportXOrPoint === "object" && viewportY === undefined) {
            // If argument is a Point, use it directly
            pointToUse = viewportXOrPoint;
        } else {
            // Throw an error if arguments do not match expected overloads
            throw new Error("Invalid arguments passed to SVGToRelative method.");
        }

        return new Point(pointToUse.x, -pointToUse.y);
    }

    viewportToFrame(viewportX: number, viewportY: number): Point;
    viewportToFrame(viewportPoint: { x: number, y: number }): Point;
    viewportToFrame(viewportXOrPoint: number | { x: number, y: number }, viewportY?: number): Point {

        // Implementation detail: Determine argument type and assign appropriate point values
        let pointToUse: Point | { x: number, y: number };

        if (typeof viewportXOrPoint === "number" && viewportY !== undefined) {
            // If arguments are numbers, construct a point using them
            pointToUse = { x: viewportXOrPoint, y: viewportY };
        } else if (typeof viewportXOrPoint === "object" && viewportY === undefined) {
            // If argument is a Point, use it directly
            pointToUse = viewportXOrPoint;
        } else {
            // Throw an error if arguments do not match expected overloads
            throw new Error("Invalid arguments passed to SVGToRelative method.");
        }

        // This is so that if the user has drawn something really large, nothing weird happens
        let bbox: DOMRect = this.getFrameBoundingRect();

        let svg = this.internalSVG.root;
        let p = svg.createSVGPoint();
        p.x = pointToUse.x;
        p.y = -pointToUse.y;
        let convertedPoint = p.matrixTransform(this.getCTM());
        convertedPoint.x -= bbox.left;
        convertedPoint.y -= bbox.top;

        return new Point(convertedPoint.x, convertedPoint.y);
    }

    /**
     * Converts a point in the SVG's coordinate system to the relative screen coordinate.
     * Overload that accepts separate x and y coordinates.
     * @param svgX - The x-coordinate in the SVG's coordinate system.
     * @param svgY - The y-coordinate in the SVG's coordinate system.
     * @returns The point in the relative screen coordinate system.
     */
    private SVGToRelative(svgX: number, svgY: number): DOMPoint;

    /**
     * Converts a point in the SVG's coordinate system to the relative screen coordinate.
     * Overload that accepts a Point object.
     * @param point - The Point object in the SVG's coordinate system.
     * @returns The point in the relative screen coordinate system.
     */
    private SVGToRelative(point: { x: number, y: number }): DOMPoint;

    private SVGToRelative(svgXOrPoint: number | { x: number, y: number }, svgY?: number): DOMPoint {
        // Implementation detail: Determine argument type and assign appropriate point values
        let pointToUse: Point | { x: number, y: number };

        if (typeof svgXOrPoint === "number" && svgY !== undefined) {
            // If arguments are numbers, construct a point using them
            pointToUse = { x: svgXOrPoint, y: svgY };
        } else if (typeof svgXOrPoint === "object" && svgY === undefined) {
            // If argument is a Point, use it directly
            pointToUse = svgXOrPoint;
        } else {
            // Throw an error if arguments do not match expected overloads
            throw new Error("Invalid arguments passed to SVGToRelative method.");
        }

        // This is so that if the user has drawn something really large, nothing weird happens
        // TODO: I think we should store the internal dimensions and use those instead?
        let bbox = this.getFrameBoundingRect();

        let svg = this.internalSVG.root;

        let p = svg.createSVGPoint();
        p.x = pointToUse.x;
        p.y = pointToUse.y;
        let convertedPoint = p.matrixTransform(this.getCTM());
        convertedPoint.x -= bbox.left;
        convertedPoint.y -= bbox.top;

        // Return the point relative to the screen
        return convertedPoint;
    }

    drawBackground(fill: string = 'var(--background)'): Rectangle {

        let background = this.frame.prependChild(
            this.frame.rectangle(
                0,
                0,
                this.frame.width,
                this.frame.height)
        );

        background.setAttribute('fill', fill);
        background.style.stroke = 'none';
        return background;
    }

    drawBorder(strokeWidth = 1.5) {

        let topLeft = this.SVGToRelative(this.getSVGMinX(), this.getSVGMinY());
        let bottomRight = this.SVGToRelative(this.getSVGMaxX(), this.getSVGMaxY());

        let border = this.borderGroup.rectangle(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
        border.setAttribute('stroke', 'var(--grid-primary)');
        border.root.setAttribute('vector-effect', 'non-scaling-stroke');
        border.style.strokeWidth = `${strokeWidth}px`;
        return border;
    }

    generateHorizontalValues(magnitude: string = 'big'): number[] {
        return this.generateValues([this.getSVGMinX(), this.getSVGMaxX()], magnitude)
    }

    generateVerticalValues(magnitude: string = 'big'): number[] {
        return this.generateValues([this.getSVGMinY(), this.getSVGMaxY()], magnitude)
    }

    generateValues(range: [number, number], magnitude: string = 'big'): number[] {

        let viewBox = this.internalViewBox.baseVal;
        let x1 = viewBox.x;
        let y1 = viewBox.y;
        let x2 = viewBox.x + viewBox.width;
        let y2 = viewBox.y + viewBox.height;

        const rangeSize = Math.max(y2 - y1, x2 - x1);

        const [start, end] = range;
        let baseStep = Math.pow(10, Math.floor(Math.log10(rangeSize)));

        // Adjust the base step if the range size is smaller than the base step
        while (baseStep > rangeSize) {
            baseStep /= 10;
        }

        let step: number;
        switch (magnitude) {
            case 'big':
                step = baseStep;
                break;
            case 'half':
                step = baseStep / 2;
                break;
            case 'small':
                step = baseStep / 10;
                break;
            case 'small-half':
                step = baseStep / 20;
                break;
            case 'tiny':
                step = baseStep / 100;
                break;
            default:
                throw new Error('Invalid magnitude');
        }

        const values = [];
        let currentValue = Math.ceil(start / step) * step;

        while (currentValue <= end) {
            values.push(Number(currentValue.toFixed(10)));
            currentValue += step;
        }

        return values;
    }

    drawGrid(horizontalValues: number[][], verticalValues: number[][]) {

        // Note: the vertical values are negated from their true values, but since
        // SVGToRelative is called this isn't an issue.

        let gridGroup = this.grid;
        gridGroup.classList.add('non-scaling-stroke');
        gridGroup.setAttribute('stroke', 'var(--grid-primary)');
        gridGroup.setAttribute('stroke-width', '1.5px');

        let x1 = this.getSVGMinX();
        let y1 = this.getSVGMinY();
        let x2 = this.getSVGMaxX();
        let y2 = this.getSVGMaxY();

        // horizontal grid lines
        let horizontalLines: Set<number> = new Set()
        let drawHorizontal = (g: Group) => {
            return (x: number) => {
                if (!horizontalLines.has(x)) {
                    let p1 = this.SVGToRelative(x, y1);
                    let p2 = this.SVGToRelative(x, y2);
                    g.line(p1.x, p1.y, p2.x, p2.y);
                    horizontalLines.add(x)
                }
            }
        }

        // vertical lines
        let verticalLines: Set<number> = new Set()
        let drawVertical = (g: Group) => {
            return (y: number) => {
                if (!verticalLines.has(y)) {
                    let p1 = this.SVGToRelative(x1, y);
                    let p2 = this.SVGToRelative(x2, y);
                    g.line(p1.x, p1.y, p2.x, p2.y);
                    verticalLines.add(y)
                }
            }
        }

        let mapping = [
            'var(--grid-quinary)',
            'var(--grid-quaternary)',
            'var(--grid-tertiary)',
            'var(--grid-secondary)',
            'var(--grid-primary)',
        ]

        let xValues: number[];
        let yValues: number[];
        let stroke: string;
        do {
            xValues = horizontalValues.pop();
            yValues = verticalValues.pop();
            stroke = mapping.pop();

            if (xValues !== undefined) {
                let group = new Group();
                group.setAttribute('stroke', stroke)
                xValues.map(drawHorizontal(group));
                gridGroup.prependChild(group);
            }

            if (yValues !== undefined) {
                let group = new Group();
                group.setAttribute('stroke', stroke)
                yValues.map(drawVertical(group));
                gridGroup.prependChild(group);
            }

        } while (xValues !== undefined || yValues !== undefined)

    }

    labelAxes(margin: number, magnitude = 'big') {

        let xAxis = this.getHorizontalValues(magnitude);
        let yAxis = this.getVerticalValues(magnitude);

        Object.entries(xAxis).forEach(([key, value]) => {

            let point = value as SVGPoint;
            let label = this.labels.appendChild(this.frame.tex(key))
            label.alignCenter()
            label.moveTo(point.x, this.frame.height + 0.5 * margin)

        });

        Object.entries(yAxis).forEach(([key, value]) => {

            let point = value as SVGPoint;
            let label = this.labels.appendChild(this.frame.tex(key))
            label.alignCenter()
            label.moveTo(-0.5 * margin, point.y)
        });

    }

    drawAxes(arrows?: boolean, labels?: boolean, offset = 60) {

        if (labels) {
            let xPoint = this.SVGToRelative(this.getSVGMaxX(), 0);
            this.labels.appendChild(this.frame.tex('x', xPoint.x + offset / 2, xPoint.y))
                .alignCenter();

            let yPoint = this.SVGToRelative(0, this.getSVGMinY());
            this.labels.appendChild(this.frame.tex('y', yPoint.x, yPoint.y - offset / 2))
                .alignCenter();
        }

        let xAxisStart = this.SVGToRelative(this.getSVGMinX(), 0);
        let xAxisEnd = this.SVGToRelative(this.getSVGMaxX(), 0);
        let xAxisLine = this.axes.line(xAxisStart.x, xAxisStart.y, xAxisEnd.x, xAxisEnd.y)
        xAxisLine.setAttribute('stroke', 'var(--font-color)')
        xAxisLine.setAttribute('stroke-width', '1.5px')
        if (arrows) {
            if (this.getSVGMinX() !== 0) {
                xAxisLine.attatchArrow(this.frame.definitions, true)
            }
            xAxisLine.attatchArrow(this.frame.definitions, false)
        }


        let yAxisStart = this.SVGToRelative(0, this.getSVGMinY());
        let yAxisEnd = this.SVGToRelative(0, this.getSVGMaxY());
        let yAxisLine = this.axes.line(yAxisStart.x, yAxisStart.y, yAxisEnd.x, yAxisEnd.y)
        yAxisLine.setAttribute('stroke', 'var(--font-color)')
        yAxisLine.setAttribute('stroke-width', '1.5px')
        if (arrows) {
            yAxisLine.attatchArrow(this.frame.definitions, true)
            yAxisLine.attatchArrow(this.frame.definitions, false)
        }

    }

    addFunction(f: FunctionType): Path {

        let path = this.fnGroup.path('');
        this.functions.push(f);
        this.paths.push(path);

        return path;
    }

    /**
     * Calls the function inverting the y-coordinate and removing non-finite output.
     */
    call(fn: FunctionType, input: number) {
        let output = -fn(input);
        if (isFinite(output)) {
            return output;
        } else {
            return NaN;
        }
    }

    /**
     * Returns a
     */
    getHorizontalGridValues(magnitude = 'big'): Map<number, Point> {
        let viewBox = this.frame.root.viewBox.baseVal;
        let x1 = Math.floor(viewBox.x);
        let x2 = Math.floor(viewBox.x + viewBox.width);

        let points = new Map();
        this.generateValues([x1, x2], magnitude).map((x) => {
            points.set(x, new Point(x, 0))
        })

        return points;
    }

    /**
     * Returns the large magnitude horizontal y-values for the gridlines
     */
    getVerticalGridValues(magnitude = 'big'): Map<number, { x: number, y: number }> {
        let viewBox = this.frame.root.viewBox.baseVal;
        let y1 = Math.floor(viewBox.y);
        let y2 = Math.floor(viewBox.y + viewBox.height);
        let points = new Map();
        this.generateValues([y1, y2], magnitude).map((y) => {
            points.set(y, new Point(0, y))
        })
        return points;
    }

    /**
     * Returns a
     */
    getHorizontalValues(magnitude = 'big'): Map<number, DOMPoint> {

        let x1 = Math.ceil(this.getSVGMinX());
        let x2 = Math.floor(this.getSVGMaxX());
        let points = new Map();
        this.generateValues([x1, x2], magnitude).map((x) => {
            points[x] = this.SVGToRelative(x, 0)
        })
        return points;
    }

    /**
     * Returns the large magnitude horizontal y-values for the gridlines
     */
    getVerticalValues(magnitude = 'big'): Map<number, DOMPoint> {
        let y1 = Math.ceil(this.getSVGMinY());
        let y2 = Math.floor(this.getSVGMaxY());
        let points = new Map();
        this.generateValues([y1, y2], magnitude).map((y) => {
            points[-y] = this.SVGToRelative(0, y)
        })
        return points;
    }

    /**
     * 
     */
    doodle(a: number[], fn: { (x: number): number; (x: number): number }) {

        let path = this.fnGroup.path('');
        path.style.stroke = 'var(--blue)';
        this.paths.push(path);
        let y = this.call(fn, a[0]);
        let d = `M ${a[0]} ${y}`;

        for (let i = 1; i < a.length; i++) {
            let x = a[i];
            d += `L ${x} ${y}`;
            d += `L ${x} ${0}`;
            y = this.call(fn, x);
            d += `L ${x} ${y}`;
        }

        path.d = d;
    }


    /**
     * Draws the parametric plot of the function for a range of t-values.
     */
    drawParametric(fn: { x: (t: number) => number, y: (t: number) => number }, tMin = -10, tMax = 10, tStep = 0.01) {

        let p = this.internalSVG.root.createSVGPoint();

        // Get the viewbox dimensions
        let bbox = this.internalViewBox.baseVal;
        let x1 = bbox.x;
        let x2 = bbox.x + bbox.width;
        let y1 = bbox.y;
        let y2 = bbox.y + bbox.height;

        let d = '';
        let hasStarted = false;
        let lastPointInside = false;  // Flag to track whether the last point was inside the viewbox

        // Helper function to check if a point is inside the viewbox
        const isInsideViewbox = (x: number, y: number) => {
            return x >= x1 && x <= x2 && y >= y1 && y <= y2;
        };

        // Helper function to interpolate a point between two parametric values, narrowing to the boundary
        const interpolate = (t1: number, t2: number) => {
            let x1 = fn.x(t1);
            let y1 = -fn.y(t1);
            let x2 = fn.x(t2);
            let y2 = -fn.y(t2);

            let inside1 = isInsideViewbox(x1, y1);
            let inside2 = isInsideViewbox(x2, y2);

            // Safety check: if both points are either inside or outside, we cannot interpolate the boundary.
            if (inside1 === inside2) {
                return { t: t2, x: x2, y: y2 };  // Default to returning t2 if no boundary is straddled
            }

            // Perform interpolation by refining t1 and t2 until the difference is small enough
            while (Math.abs(t2 - t1) > 0.001) {
                let tMid = (t1 + t2) / 2;
                let xMid = fn.x(tMid);
                let yMid = -fn.y(tMid);

                let insideMid = isInsideViewbox(xMid, yMid);

                if (insideMid === inside1) {
                    // tMid is on the same side as t1, so move t1 closer to t2
                    t1 = tMid;
                    x1 = xMid;
                    y1 = yMid;
                } else {
                    // tMid is on the same side as t2, so move t2 closer to t1
                    t2 = tMid;
                    x2 = xMid;
                    y2 = yMid;
                }
            }

            // Return the point that is now closest to the boundary
            return { t: t2, x: x2, y: y2 };
        };

        // Loop through a range of t values
        for (let t = tMin; t <= tMax; t += tStep) {

            // Calculate parametric x(t) and y(t) coordinates
            let x_t = fn.x(t);  // x(t)
            let y_t = -fn.y(t);  // y(t)

            // Map the point to the internal coordinate system
            p.x = x_t;
            p.y = y_t;

            let r = this.SVGToRelative(p);
            let isInside = isInsideViewbox(x_t, y_t);

            if (isInside) {
                // If the point was outside before and now it's inside, interpolate to the entry point
                if (!lastPointInside) {

                    // Interpolate the re-entry point
                    let { t: tEntry, x: xEntry, y: yEntry } = interpolate(t - tStep, t);
                    p.x = xEntry;
                    p.y = yEntry;
                    let rEntry = this.SVGToRelative(p);
                    d += `M ${rEntry.x} ${rEntry.y}`;  // Move to the entry point without drawing
                    hasStarted = true
                }

                // Draw the current point
                d += `${hasStarted ? 'L' : 'M'} ${r.x} ${r.y}`;
                hasStarted = true;
            } else {
                // If the point was inside before and now it's outside, interpolate to the exit point
                if (lastPointInside) {

                    // Interpolate the exit point
                    let { t: tExit, x: xExit, y: yExit } = interpolate(t - tStep, t);
                    p.x = xExit;
                    p.y = yExit;
                    let rExit = this.SVGToRelative(p);
                    d += `L ${rExit.x} ${rExit.y}`;  // Draw to the exit point
                }
            }

            // Update the flag to track whether the last point was inside or outside
            lastPointInside = isInside;
        }

        let path = this.fnGroup.path('');
        this.paths.push(path);
        path.d = d;

        return path;
    }

    /**
     * Draws the parametric plot of the function for a range of t-values.
     */
    drawParametricArea(fn: { x: (t: number) => number, y: (t: number) => number }, tMin = -10, tMax = 10, tStep = 0.01) {

        let p = this.internalSVG.root.createSVGPoint();

        let r = this.SVGToRelative(new Point(0, 0));

        let d = `M ${r.x} ${r.y}`;

        // Loop through a range of t values
        for (let t = tMin; t <= tMax; t += tStep) {

            // Calculate parametric x(t) and y(t) coordinates
            let x_t = fn.x(t);  // x(t)
            let y_t = fn.y(t);  // y(t)

            // Map the point to the internal coordinate system
            p.x = x_t;
            p.y = -y_t;

            r = this.SVGToRelative(p);

            d += `L ${r.x} ${r.y}`;

        }


        // Calculate parametric x(t) and y(t) coordinates
        let x_t = fn.x(tMax);
        let y_t = fn.y(tMax);

        // Map the point to the internal coordinate system
        p.x = x_t;
        p.y = -y_t;

        r = this.SVGToRelative(p);
        d += `L ${r.x} ${r.y}`;

        let path = this.fnGroup.path('');
        this.paths.push(path);
        path.d = d + 'Z';

        return path
    }

    /**
     * Draws the plot of the function for all x-values in the view ports range 
     */
    drawArea(x1: number, x2: number, fn: (number) => number): Path {

        x1 = this.SVGToScreen(x1, 0).x;
        x2 = this.SVGToScreen(x2, 0).x;

        let ctm = this.getCTM();
        let inverse = ctm.inverse();
        let point = this.internalSVG.root.createSVGPoint();

        point.x = x1;
        point.y = 0;
        let p = point.matrixTransform(inverse);
        let d: string = `M ${p.x} ${0}`;
        d += `L ${p.x} ${this.call(fn, p.x)}`;

        // Loop through each pixel, convert the x-position to the internal coordinates, call the 
        // function and add to the path
        for (let x = x1; x <= x2; x++) {
            point.x = x;
            p = point.matrixTransform(inverse);
            d += `L ${p.x} ${this.call(fn, p.x)}`;
            // TODO: trim huge y values
        }

        point.x = x2;
        point.y = 0;
        p = point.matrixTransform(inverse);
        d += `L ${p.x} ${0} Z`;

        let path = this.fnGroup.path(d);
        path.style.stroke = 'var(--font-color)';
        this.paths.push(path);

        return path;
    }


    findXCoordinateForY(start: { x: number; y: number }, end: { x: number; y: number }, targetY: number) {
        // Parse inputs to ensure they're numbers
        let x1 = start.x;
        let y1 = start.y;
        let x2 = end.x;
        let y2 = end.y;
        targetY = targetY;

        // Check if targetY is within the y-range of the line
        if (targetY < Math.min(y1, y2) || targetY > Math.max(y1, y2)) {
            throw new Error('Target Y value is outside of the line\'s range');
        }

        // Handle vertical line case
        if (x1 === x2) {
            if (y1 === y2) {
                throw new Error('Line start and end points are the same');
            }
            return x1;
        }

        // Calculate slope of the line
        let slope = (y2 - y1) / (x2 - x1);

        // Use the point slope form to find the x coordinate
        let x = ((targetY - y1) / slope) + x1;

        return x;
    }

    /**
     * Determines if the given coordinates are outside the viewport.
     * 
     * @param x - The x-coordinate of the point.
     * @param y - The y-coordinate of the point.
     * @returns `true` if the point is outside the viewport, `false` otherwise.
     */
    outsideViewport(x: number, y: number): boolean;

    /**
     * Determines if the given point is outside the viewport.
     * 
     * @param point - An object representing a point, containing `x` and `y` coordinates.
     * @returns `true` if the point is outside the viewport, `false` otherwise.
     */
    outsideViewport(point: { x: number, y: number }): boolean;


    outsideViewport(arg1: number | { x: number, y: number }, arg2?: number): boolean {

        let viewBox = this.internalViewBox.baseVal;
        let x1 = viewBox.x;
        let x2 = viewBox.x + viewBox.width;
        let y1 = viewBox.y;
        let y2 = viewBox.y + viewBox.height;

        let x: number, y: number;

        if (typeof arg1 === "number" && typeof arg2 === "number") {
            // Handle the case where (x, y) are passed directly
            x = arg1;
            y = arg2;
        } else if (typeof arg1 === "object" && arg1 !== null) {
            // Handle the case where a Point is passed
            x = arg1.x;
            y = arg1.y;
        } else {
            throw new Error("Invalid arguments passed to outsideViewport");
        }

        return x < x1 || x > x2 || y < y1 || y > y2;
    }


    private outsideRange(y: number) {
        let viewBox = this.internalViewBox.baseVal;
        let y1 = viewBox.y;
        let y2 = viewBox.y + viewBox.height;
        return y < y1 || y > y2;
    }


    /**
    * Draws the plot of the function for all x-values in the view ports range 
    */
    draw() {

        let spacing = 0;
        let bbox = this.backgroundRectangle.root.getBoundingClientRect();
        let x1 = Math.floor(bbox.x + spacing);
        let x2 = Math.ceil(bbox.x + bbox.width - spacing);
        let ctm = this.getCTM();
        let inverse = ctm.inverse();
        let point = this.internalSVG.root.createSVGPoint();

        for (let i = 0; i < this.functions.length; i++) {

            let fn = this.functions[i];

            point.x = x1;
            point.y = 0;
            let p = point.matrixTransform(inverse);

            let output = {
                x: p.x,
                y: this.call(fn, p.x)
            };

            point.x -= 1;
            p = point.matrixTransform(inverse);
            let previous = {
                x: p.x,
                y: this.call(fn, p.x)
            };

            let d: string = '';
            let hasStarted = false;
            let t = this.SVGToRelative(output.x, output.y);
            if (isFinite(output.y) && !this.outsideRange(output.y)) {
                d = `M ${t.x} ${t.y}`
            }

            let minY = this.getSVGMinY();
            let maxY = this.getSVGMaxY();

            // Loop through each pixel
            for (let x = x1; x <= x2; x+= 0.5) {

                point.x = x;
                let p = point.matrixTransform(inverse);
                let output = {
                    x: p.x,
                    y: this.call(fn, p.x)
                };

                if(!isFinite(output.y)) {
                    continue;
                }

                let constrain = {
                    c: hasStarted ? 'L' : 'M',
                    x: output.x,
                    y: output.y
                };

                hasStarted = true;

                const outsideCurrent = this.outsideRange(output.y);
                const outsidePrevious = this.outsideRange(previous.y);

                if (outsideCurrent && outsidePrevious) {
                    // Both points outside, skip
                    previous = output;
                    continue;
                }

                if (outsideCurrent) {
                    // Leaving the viewbox
                    if (output.y < minY) {
                        constrain.x = this.findXCoordinateForY(previous, output, minY);
                        constrain.y = minY;
                    } else if (output.y > maxY) {
                        constrain.x = this.findXCoordinateForY(previous, output, maxY);
                        constrain.y = maxY;
                    }
                } else if (outsidePrevious) {
                    // Entering the viewbox
                    constrain.c = 'M';
                    if (previous.y < minY) {
                        constrain.x = this.findXCoordinateForY(previous, output, minY);
                        constrain.y = minY;
                    } else if (previous.y > maxY) {
                        constrain.x = this.findXCoordinateForY(previous, output, maxY);
                        constrain.y = maxY;
                    }
                }

                let t = this.SVGToRelative(constrain.x, constrain.y);
                d += `${constrain.c} ${t.x} ${t.y}`;

                previous = output;
            }

            this.paths[i].d = d;
        }
    }

    line(p1: Point, p2: Point, color: string = 'var(--font-color)'): Line {

        let v = this.foreground.line(0, 0, 0, 0);
        v.setAttribute('stroke-width', '1.5');
        v.setAttribute('stroke', color);
        v.addDependency(p1, p2)
        v.update = () => {

            let fp1 = this.viewportToFrame(p1.x, p1.y);
            let fp2 = this.viewportToFrame(p2.x, p2.y);

            v.x1 = fp1.x;
            v.y1 = fp1.y;
            v.x2 = fp2.x;
            v.y2 = fp2.y;
        };
        v.update();

        return v;
    }

    tex(s: string, x: number = 0, y: number = 0, background: boolean = true, backgroundColor = 'var(--background)'): Tex {
        let tex = this.foreground.appendChild(new Tex(s, x, y));
        tex.setAttribute('id', s);

        let r = tex.drawBackground(false, backgroundColor);
        if (!background) {
            r.setAttribute('fill', 'transparent')
        }

        return tex;
    }

    gridBrace(p1: Point, p2: Point, spacing: number = 0) {

        let sizes =  Brace.sizes;

        let group = this.foreground.group();

        let path = group.path("");
        path.setAttribute('fill', 'var(--font-color)');

        group.addDependency(p1, p2);
        group.update = () => {

            let fp1 = this.viewportToFrame(p1.x, p1.y);
            let fp2 = this.viewportToFrame(p2.x, p2.y);
            let x1 = fp1.x;
            let y1 = fp1.y;
            let x2 = fp2.x;
            let y2 = fp2.y;

            const length = Math.hypot(x2 - x1, y2 - y1);
            const angle = Math.atan2(y2 - y1, x2 - x1);

            // Adjust x1, y1, x2, y2 to add spacing at the beginning and end of the path
            x1 += spacing * Math.cos(angle + TAU / 4);
            y1 += spacing * Math.sin(angle + TAU / 4);
            x2 -= spacing * Math.cos(angle + TAU / 4);
            y2 -= spacing * Math.sin(angle + TAU / 4);

            const sizesArray = Array.from(sizes.keys()).sort((a, b) => a - b);
            const smallerOrEqual = sizesArray.reverse().find(size => size <= length);
            const closest = (smallerOrEqual !== undefined) ? smallerOrEqual : sizesArray[sizesArray.length - 1];

            group.setAttribute('transform', `translate(${x1}, ${y1}) rotate(${angle / Math.PI * 180}) scale(${length / closest}, 1)`);
            path.d = sizes.get(closest);

        }
        group.update();


        // path.setAttribute('transform', `scale(${length/closest}, 0)`)

        return group;
    }

    displayBrace(p1: Point, p2: Point, label: string, options : {
        reverse?: Boolean,
        space?: number,
        color?: string,
        buff?: number,
        group?: Group 
    } = {}): Tex {

        let defaultOptions = {
            reverse: false,
            color: 'var(--primary)',
            space: 4,
            buff: 42
        }

        options = { ...defaultOptions, ...options };

        let g = options.group ? options.group : this.foreground.group();
        if (options.reverse) {
            g.appendChild(this.gridBrace(p1, p2, options.space));
        } else {
            g.appendChild(this.gridBrace(p2, p1, options.space));
        }

        let l = this.tex(label, 0, 0)
            .alignCenter();

        g.appendChild(l);

        l.addDependency(p1, p2);
        l.update = () => {
            let mx = p1.x + (p2.x - p1.x) / 2;
            let my = p1.y + (p2.y - p1.y) / 2;

            const a = Math.atan2(p2.y - p1.y, p2.x - p1.x) + TAU / 4 + (options.reverse ? 0 : TAU / 2);

            l.moveTo( this.viewportToFrame(mx,my))
            .shift(
                - options.buff * Math.cos(a),
                options.buff * Math.sin(a)
            );
        };
        l.update();

        return l;

    }

    displayPoint(p: Point, color: string = 'var(--font-color)', radius: number = 4): Circle {

        let c = this.frame.circle(0, 0, radius);
        c.setAttribute('fill', color);
        c.setAttribute('stroke', 'var(--background)');
        c.setAttribute('stroke-width', '1.5px');
        c.addDependency(p)
        c.update = () => {
            let relativePoint = this.viewportToFrame(p.x, p.y);
            c.cx = relativePoint.x;
            c.cy = relativePoint.y;
        }
        c.update();


        return this.foreground.appendChild(c);
    }

    displayTex(p:Point, s:string) : Tex {
        let t = this.tex(s)
        .alignCenter()

        t.addDependency(p);
        t.update = () => {
            t.moveTo(this.viewportToFrame(p))
        }
        t.update();

        return t;
    }

    displayVector(p: Point, color: string = 'var(--font-color)'): Line {
        let o = new Point(0,0)
        let v = this.frame.line(0, 0, 0, 0);
        v.setAttribute('stroke-width', '1.5');
        v.setAttribute('stroke', color);
        let m = v.attatchArrow(this.frame.definitions, false, color);
        v.update = () => {

            let fp1 = this.viewportToFrame(o.x, o.y);
            let fp2 = this.viewportToFrame(p.x, p.y);

            v.x1 = fp1.x;
            v.y1 = fp1.y;
            v.x2 = fp2.x;
            v.y2 = fp2.y;
        };
        v.addDependency(o, p);
        v.update();
        return v;
    }

    displayAngle(p0: Point, p1: Point, p2: Point, r = 24, fullRotation = true): Path {

        let path = this.foreground.path('');
        path.setAttribute('stroke', 'var(--font-color)');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'var(--font-color)');
        path.setAttribute('fill-opacity', '0.2');

        path.addDependency(p0, p1, p2);
        path.update = () => {

            let fp0 = this.viewportToFrame(p0);
            let fp1 = this.viewportToFrame(p1);
            let fp2 = this.viewportToFrame(p2);

            let a1 = Math.atan2(fp1.y - fp0.y, fp1.x - fp0.x);
            let a2 = Math.atan2(fp2.y - fp0.y, fp2.x - fp0.x);
            let angle = a2 - a1;

            // normalize
            if (angle < 0) {
                angle = 2 * Math.PI + angle;
            }

            let arcFlag : boolean;
            let sweepFlag : boolean;

            if(fullRotation) {
                arcFlag = (angle > Math.PI) ? false : true;
                sweepFlag = false;
            } else {
                arcFlag = false;
                sweepFlag = (angle > Math.PI) ? false : true;
            }
 
            let x1 = r * Math.cos(a1) + fp0.x;
            let y1 = r * Math.sin(a1) + fp0.y;
            let x2 = r * Math.cos(a2) + fp0.x;
            let y2 = r * Math.sin(a2) + fp0.y;

            path.d = `
              M ${fp0.x} ${fp0.y}
              L ${x1} ${y1}
              A ${r} ${r} 0 ${+arcFlag} ${+sweepFlag} ${x2} ${y2}
              Z`;
        };

        path.update();
        return path;
    }



}
