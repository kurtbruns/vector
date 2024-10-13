import { Circle, TAU } from "../.."
import { Frame, Tex } from "../../elements"
import { Group, Line, Path, Rectangle, SVG } from "../../elements/svg"
import { Point } from "../../model"

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
            return 0;
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
            let t = this.SVGToRelative(output.x, output.y);
            if (!this.outsideRange(output.y)) {
                d = `M ${t.x} ${t.y}`
            }

            let minY = this.getSVGMinY();
            let maxY = this.getSVGMaxY();

            // Loop through each pixel
            for (let x = x1; x <= x2; x++) {

                point.x = x;
                let p = point.matrixTransform(inverse);
                let output = {
                    x: p.x,
                    y: this.call(fn, p.x)
                };

                let constrain = {
                    c: 'L',
                    x: output.x,
                    y: output.y
                };

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

        // Braces with a height of 16 and the specified length 60, 90, 180 or 240
        const sizes: Map<number, string> = new Map();
        sizes.set(60, "M0.182678 -2.6147e-06C0.416678 -2.60447e-06 0.56566 0.106997 0.63266 0.320997C0.69866 0.533997 0.770656 0.904997 0.847656 1.432C0.925656 1.959 1.04067 2.419 1.19467 2.815C2.29367 5.679 4.47268 7.111 7.73068 7.111L21.7607 7.111C25.9057 7.111 28.5657 9.099 29.7427 13.074C30.9177 9.099 33.4447 7.111 37.3197 7.111L51.6587 7.111C52.6027 7.111 53.3167 7.078 53.7977 7.012C55.1477 6.781 56.3137 6.144 57.2967 5.098C58.2797 4.053 58.8677 2.757 59.0617 1.209C59.0617 1.176 59.0717 1.081 59.0907 0.926001C59.1097 0.770001 59.1287 0.658 59.1487 0.593C59.1677 0.526 59.1977 0.435999 59.2367 0.320999C59.2767 0.204999 59.3477 0.122999 59.4477 0.0739994C59.5477 0.0239994 59.6577 -1.49641e-08 59.7797 -9.63126e-09C60.2817 1.23119e-08 59.9257 3.667 58.7137 5.59C57.5007 7.512 55.7407 8.596 53.4327 8.84C53.0447 8.873 52.4727 8.889 51.7167 8.889L37.6097 8.889C36.2987 8.889 35.1517 9.107 34.1677 9.543C33.1847 9.98 32.4557 10.543 31.9837 11.235C31.5117 11.926 31.1697 12.507 30.9577 12.976C30.7457 13.445 30.5997 13.918 30.5247 14.396C30.5247 14.495 30.5137 14.639 30.4947 14.828C30.4757 15.017 30.4417 15.169 30.3937 15.285C30.3457 15.4 30.3027 15.516 30.2637 15.63C30.2257 15.746 30.1577 15.836 30.0607 15.902C29.9647 15.967 29.8577 16.001 29.7427 16.001C29.5887 16.001 29.4627 15.977 29.3667 15.927C29.2707 15.877 29.1977 15.787 29.1497 15.655C29.1017 15.524 29.0677 15.388 29.0487 15.248C29.0297 15.109 29.0007 14.923 28.9627 14.692C28.9237 14.461 28.8857 14.248 28.8467 14.05C28.5767 12.832 27.9697 11.733 27.0257 10.753C26.0797 9.774 24.8747 9.186 23.4097 8.988C23.0247 8.922 22.4457 8.889 21.6747 8.889L8.07767 8.889C7.30367 8.889 6.68566 8.86 6.22266 8.803C5.76066 8.746 5.11368 8.526 4.28268 8.143C3.45168 7.76 2.70568 7.202 2.04468 6.469C-0.151323 4.443 -0.199322 -2.6314e-06 0.182678 -2.6147e-06Z");
        sizes.set(90, "M0.123199 0.497066C0.380199 0.497066 0.545225 0.604066 0.618225 0.818066C0.691225 1.03107 0.770225 1.40207 0.855225 1.92907C0.941225 2.45607 1.06721 2.91606 1.23721 3.31206C2.44621 6.17606 4.84322 7.60807 8.42722 7.60807L35.8602 7.60807C40.4202 7.60807 43.3462 9.59607 44.6402 13.5711C45.9332 9.59607 48.7122 7.60807 52.9752 7.60807L80.7482 7.60807C81.7862 7.60807 82.5722 7.57507 83.1012 7.50907C84.5862 7.27807 85.8692 6.64107 86.9502 5.59507C88.0322 4.55007 88.6792 3.25406 88.8912 1.70606C88.8912 1.67306 88.9022 1.57807 88.9232 1.42307C88.9442 1.26707 88.9652 1.15506 88.9862 1.09006C89.0072 1.02306 89.0402 0.933069 89.0832 0.818069C89.1272 0.702069 89.2052 0.620068 89.3162 0.571068C89.4262 0.521068 89.5482 0.49707 89.6812 0.49707C90.2332 0.49707 89.8422 4.16407 88.5092 6.08707C87.1752 8.00907 85.2392 9.09307 82.7002 9.33707C82.2732 9.37007 81.6442 9.38607 80.8122 9.38607L53.2942 9.38607C51.8522 9.38607 50.5902 9.60406 49.5082 10.0401C48.4262 10.4771 47.6252 11.0401 47.1062 11.7321C46.5872 12.4231 46.2112 13.0041 45.9772 13.4731C45.7432 13.9421 45.5842 14.4151 45.5002 14.8931C45.5002 14.9921 45.4882 15.1361 45.4672 15.3251C45.4462 15.5141 45.4092 15.6661 45.3562 15.7821C45.3032 15.8971 45.2562 16.0131 45.2132 16.1271C45.1712 16.2431 45.0972 16.3331 44.9902 16.3991C44.8842 16.4641 44.7672 16.4981 44.6402 16.4981C44.4712 16.4981 44.3322 16.4741 44.2272 16.4241C44.1222 16.3741 44.0412 16.2841 43.9882 16.1521C43.9352 16.0211 43.8982 15.8851 43.8772 15.7451C43.8562 15.6061 43.8242 15.4201 43.7822 15.1891C43.7392 14.9581 43.6972 14.7451 43.6542 14.5471C43.3572 13.3291 42.6902 12.2301 41.6512 11.2501C40.6112 10.2711 39.2852 9.68307 37.6742 9.48507C37.2502 9.41907 36.6142 9.38607 35.7662 9.38607L8.81021 9.38607C7.95921 9.38607 7.2792 9.35707 6.7702 9.30007C6.2612 9.24307 5.5502 9.02306 4.6362 8.64006C3.7222 8.25706 2.90122 7.69907 2.17422 6.96607C-0.240775 4.94007 -0.294779 0.497066 0.126221 0.497066L0.123199 0.497066Z");
        sizes.set(180, "M0.19754 -7.85932e-06C0.45454 -7.84809e-06 0.619566 0.106991 0.692566 0.320991C0.765566 0.533991 0.844565 0.904999 0.929565 1.432C1.01557 1.959 1.14155 2.41899 1.31155 2.81499C2.52055 5.67899 4.91756 7.111 8.50156 7.111L80.9345 7.111C85.4945 7.111 88.4205 9.099 89.7145 13.074C91.0075 9.099 93.7866 7.111 98.0496 7.111L170.823 7.11101C171.861 7.11101 172.647 7.07801 173.176 7.01201C174.661 6.78101 175.944 6.14401 177.025 5.09801C178.107 4.05301 178.754 2.757 178.966 1.209C178.966 1.176 178.977 1.08101 178.998 0.92601C179.019 0.77001 179.04 0.658002 179.061 0.593002C179.082 0.526002 179.115 0.435999 179.158 0.320999C179.202 0.204999 179.28 0.123005 179.391 0.0740051C179.501 0.0240051 179.623 -1.64078e-08 179.756 -1.05942e-08C180.308 1.35345e-08 179.917 3.66701 178.584 5.59001C177.25 7.51201 175.314 8.59601 172.775 8.84001C172.348 8.87301 171.719 8.88901 170.887 8.88901L98.3686 8.889C96.9266 8.889 95.6645 9.107 94.5825 9.543C93.5005 9.98 92.6995 10.543 92.1805 11.235C91.6615 11.926 91.2855 12.507 91.0515 12.976C90.8175 13.445 90.6586 13.918 90.5746 14.396C90.5746 14.495 90.5626 14.639 90.5416 14.828C90.5206 15.017 90.4835 15.169 90.4305 15.285C90.3775 15.4 90.3305 15.516 90.2875 15.63C90.2455 15.746 90.1715 15.836 90.0645 15.902C89.9585 15.967 89.8415 16.001 89.7145 16.001C89.5455 16.001 89.4065 15.977 89.3015 15.927C89.1965 15.877 89.1156 15.787 89.0626 15.655C89.0096 15.524 88.9725 15.388 88.9515 15.248C88.9305 15.109 88.8985 14.923 88.8565 14.692C88.8135 14.461 88.7715 14.248 88.7285 14.05C88.4315 12.832 87.7646 11.733 86.7256 10.753C85.6856 9.774 84.3596 9.186 82.7486 8.988C82.3246 8.922 81.6885 8.889 80.8405 8.889L8.88455 8.889C8.03355 8.889 7.35354 8.86 6.84454 8.803C6.33554 8.746 5.62454 8.526 4.71054 8.143C3.79654 7.76 2.97557 7.202 2.24857 6.469C-0.166434 4.443 -0.220438 -7.87759e-06 0.200562 -7.85919e-06L0.19754 -7.85932e-06Z");
        sizes.set(240, "M0.196632 0.49706C0.445911 0.49706 0.605871 0.604074 0.6765 0.818074C0.747129 1.03107 0.823967 1.40207 0.906021 1.92907C0.989114 2.45607 1.1117 2.91606 1.2758 3.31206C2.44845 6.17606 4.77296 7.60808 8.24833 7.60808L110.692 7.60809C115.113 7.60809 117.952 9.59607 119.207 13.5711C120.46 9.59607 123.156 7.60809 127.289 7.60809L231.102 7.60809C232.108 7.60809 232.871 7.57509 233.384 7.50909C234.824 7.27809 236.068 6.64109 237.117 5.59509C238.166 4.55009 238.793 3.25409 238.999 1.70609C238.999 1.67309 239.009 1.5781 239.03 1.4231C239.051 1.2671 239.07 1.15509 239.091 1.09009C239.112 1.02309 239.143 0.933085 239.186 0.818085C239.228 0.702085 239.304 0.620075 239.411 0.571075C239.518 0.521075 239.635 0.49707 239.765 0.49707C240.3 0.49707 239.921 4.1641 238.628 6.0871C237.334 8.0091 235.457 9.0931 232.994 9.3371C232.58 9.3701 231.97 9.38608 231.163 9.38608L127.598 9.38607C126.2 9.38607 124.975 9.60406 123.926 10.0401C122.877 10.4771 122.1 11.0401 121.597 11.7321C121.093 12.4231 120.728 13.0041 120.502 13.4731C120.275 13.9421 120.121 14.4151 120.04 14.8931C120.04 14.9921 120.028 15.1361 120.007 15.3251C119.987 15.5141 119.951 15.6661 119.899 15.7821C119.848 15.8971 119.802 16.0131 119.761 16.1271C119.721 16.2431 119.648 16.3331 119.545 16.3991C119.442 16.4641 119.329 16.4981 119.206 16.4981C119.041 16.4981 118.907 16.4741 118.805 16.4241C118.702 16.3741 118.624 16.2841 118.573 16.1521C118.522 16.0211 118.486 15.8851 118.465 15.7451C118.444 15.6061 118.414 15.4201 118.373 15.1891C118.331 14.9581 118.29 14.7451 118.249 14.5471C117.961 13.3291 117.314 12.2301 116.306 11.2501C115.297 10.2711 114.011 9.68307 112.449 9.48507C112.038 9.41907 111.421 9.38607 110.598 9.38607L8.61706 9.38607C7.79133 9.38607 7.13282 9.35707 6.63841 9.30007C6.14505 9.24307 5.45536 9.02307 4.56835 8.64007C3.68133 8.25707 2.88573 7.69908 2.18048 6.96608C-0.161703 4.94008 -0.213655 0.49706 0.19454 0.49706L0.196632 0.49706Z");

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

    brace(p1: Point, p2: Point, label?: string, reverse: boolean = false, color: string = 'var(--font-color)', space: number = 4): Tex {

        if (reverse) {
            this.gridBrace(p1, p2, space);
        } else {
            this.gridBrace(p2, p1, space);
        }

        if (label) {
            let l = this.tex(label, 0, 0);
            l.alignCenter();
            l.addDependency(p1, p2);
            l.update = () => {
                let mx = p1.x + (p2.x - p1.x) / 2;
                let my = p1.y + (p2.y - p1.y) / 2;

                const p = this.viewportToFrame(mx, my);
                const a = Math.atan2(p2.y - p1.y, p2.x - p1.x) + TAU / 4 + (reverse ? 0 : TAU / 2);
                let buff = 42;
                l.moveTo({ x: p.x - buff * Math.cos(a), y: p.y + buff * Math.sin(a) });
            };
            l.update();
            return l;
        } else {
            return null;
        }

    }

    displayPoint(p: Point, color: string = 'var(--font-color)', radius: number = 4.5): Circle {

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


}
