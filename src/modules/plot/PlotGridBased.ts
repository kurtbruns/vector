import { Grid } from "../../elements/Grid";
import { Group } from "../../elements/svg/group";
import { Line } from "../../elements/svg/line";
import { Path } from "../../elements/svg/path";
import { Rectangle } from "../../elements/svg/rectangle";
import { Point } from "../../model/Point";

type FunctionType = (x: number) => number;

/**
 * Configuration passed the the plot constructor
 */
interface Configuration {

    // These dimensions affect the visible area of the plot
    x?: number
    y?: number
    width?: number
    height?: number

    // These dimensions affect the coordinate system used for plotting
    internalX?: number
    internalY?: number
    internalWidth?: number
    internalHeight?: number

    // Toggles weather the plot fills the available space
    responsive?: boolean
    origin?: string
    title?: string
    grid?: boolean
    border?: boolean

    // Initial function to draw
    f?: FunctionType

}

/**
 * A plot visualizes one or more one-to-one functinos.
 */
export class PlotGridBased extends Grid {

    /**
     * Array of functions paths
     */
    functionPaths: Path[];

    /**
     * Array of functions
     */
    functions: FunctionType[];

    /**
     * The group (layer) used to place the path above the grid and such
     */
    fnGroup: Group;

    constructor(container: Element, config: Configuration) {

        // default configuration
        let defaultConfig = {
            grid: true
        }

        // choose users config over default
        config = { ...defaultConfig, ...config };

        super(container, config);

        if (config.grid) {
            this.drawGridLines();
        }

        this.classList.add('plot-grid-based')
        this.fnGroup = this.foreground.group();
        this.fnGroup.classList.add('non-scaling-stroke')
        this.fnGroup.setAttribute('stroke', 'var(--primary)');
        this.fnGroup.setAttribute('stroke-width', '1.5px');
        this.functionPaths = [];
        this.functions = [];

        this.setAttribute('preserveAspectRatio', 'none');

        if (config.f) {
            this.addFunction(config.f);
            this.draw();
        }

    }

    getMinY() {
        let viewBox = this.root.viewBox.baseVal
        return viewBox.y
    }

    getMaxY() {
        let viewBox = this.root.viewBox.baseVal
        return viewBox.y + viewBox.height
    }

    getMinX() {
        let viewBox = this.root.viewBox.baseVal
        return viewBox.x
    }

    getMaxX() {
        let viewBox = this.root.viewBox.baseVal
        return viewBox.x + viewBox.width
    }

    drawAxes(arrows?: boolean): Group {

        let axisGroup = this.gridGroup.appendChild(new Group());
        axisGroup.classList.add('axes');

        let xAxis = axisGroup.line(this.getMaxX(), 0, this.getMinX(), 0);
        let yAxis = axisGroup.line(0, this.getMinY(), 0, this.getMaxY());

        xAxis.setAttribute('vector-effect', 'non-scaling-stroke');
        yAxis.setAttribute('vector-effect', 'non-scaling-stroke');

        if (arrows) {
            let defs = this.defs();
            xAxis.attatchArrow(defs, true, '#a0a0a0');
            xAxis.attatchArrow(defs, false, '#a0a0a0');
            yAxis.attatchArrow(defs, true, '#a0a0a0');
            yAxis.attatchArrow(defs, false, '#a0a0a0');
        }

        return axisGroup;
    }

    addFunction(f: FunctionType): Path {

        let path = this.fnGroup.path('');
        this.functions.push(f);
        this.functionPaths.push(path);

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
        let viewBox = this.root.viewBox.baseVal;
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
        let viewBox = this.root.viewBox.baseVal;
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
        // TODO: some sort of setter getter
        let viewBox = this.root.viewBox.baseVal;
        let x1 = Math.floor(viewBox.x);
        let x2 = Math.floor(viewBox.x + viewBox.width);
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
        let viewBox = this.root.viewBox.baseVal;
        let y1 = Math.floor(viewBox.y);
        let y2 = Math.floor(viewBox.y + viewBox.height);
        let points = new Map();
        this.generateValues([y1, y2], magnitude).map((y) => {
            points[-y] = this.SVGToRelative(0, y)
        })
        return points;
    }

    /**
     * 
     */
    doodle(a: number[], fn) {

        let path = this.fnGroup.path('');
        path.style.stroke = 'var(--blue)';
        this.functionPaths.push(path);
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
     * Draws the plot of the function for all x-values in the view ports range 
     */
    draw() {

        let spacing = 0;
        let bbox = this.root.getBoundingClientRect();
        let x1 = bbox.x + spacing;
        let x2 = bbox.x + bbox.width - spacing;

        let ctm = this.getInternalSVG().root.getScreenCTM();
        let inverse = ctm.inverse();
        let point = this.getInternalSVG().root.createSVGPoint();

        for (let i = 0; i < this.functions.length; i++) {

            let fn = this.functions[i];

            point.x = x1;
            point.y = 0;
            let p = point.matrixTransform(inverse);
            let d: string = `M ${p.x} ${this.call(fn, p.x)}`;

            // Loop through each pixel, convert the x-position to the internal coordinates, call the 
            // function and add to the path
            for (let x = x1; x <= x2; x++) {
                point.x = x;
                p = point.matrixTransform(inverse);
                d += `L ${p.x} ${this.call(fn, p.x)}`;
                // TODO: trim huge y values
            }

            this.functionPaths[i].d = d;
        }
    }

    /**
   * Draws the plot of the function for all x-values in the view ports range 
   */
    drawArea(x1: number, x2: number, fn: (number) => number): Path {

        // let spacing = 0;
        // let bbox = this.root.getBoundingClientRect();
        // let x1 = bbox.x + spacing;
        // let x2 = bbox.x + bbox.width - spacing;

        x1 = this.SVGToScreen(x1, 0).x;
        x2 = this.SVGToScreen(x2, 0).x;

        let ctm = this.getInternalSVG().root.getScreenCTM();
        let inverse = ctm.inverse();
        let point = this.getInternalSVG().root.createSVGPoint();

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
        path.style.stroke = 'var(--blue)';
        this.functionPaths.push(path);

        return path;
    }


    findXCoordinateForY(lineStart, lineEnd, targetY) {
        // Parse inputs to ensure they're numbers
        let x1 = lineStart.x;
        let y1 = lineStart.y;
        let x2 = lineEnd.x;
        let y2 = lineEnd.y;
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



    outsideViewBox(y) {
        let viewBox = this.root.viewBox.baseVal;
        let y1 = viewBox.y;
        let y2 = viewBox.y + viewBox.height;
        return y < y1 || y > y2;
    }


    /**
    * Draws the plot of the function for all x-values in the view ports range 
    */
    draw2() {

        let spacing = 0;
        let bbox = this.root.getBoundingClientRect();
        let x1 = bbox.x + spacing;
        let x2 = bbox.x + bbox.width - spacing;

        let ctm = this.getInternalSVG().root.getScreenCTM();
        let inverse = ctm.inverse();
        let point = this.getInternalSVG().root.createSVGPoint();

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
            if (!this.outsideViewBox(output.y)) {
                d = `M ${output.x} ${output.y}`
            }

            // Loop through each pixel, convert the x-position to the internal coordinates, call the 
            // function and add to the path
            for (let x = x1; x <= x2; x++) {
                point.x = x;
                p = point.matrixTransform(inverse);
                output = {
                    x: p.x,
                    y: this.call(fn, p.x)
                }

                let command = 'L'

                if (this.outsideViewBox(output.y) && this.outsideViewBox(previous.y)) {
                    // skip
                    previous = output;
                    continue;
                } else if (this.outsideViewBox(output.y)) {
                    // leaving
                    if (output.y < this.getMinY()) {
                        d += `L ${this.findXCoordinateForY(previous, output, this.getMinY())} ${this.getMinY()} `;
                    } else if (output.y > this.getMaxY()) {
                        d += `L ${this.findXCoordinateForY(previous, output, this.getMaxY())} ${this.getMaxY()} `;
                    }
                } else if (this.outsideViewBox(previous.y)) {
                    // entering
                    if (previous.y < this.getMinY()) {
                        d += `M ${this.findXCoordinateForY(previous, output, this.getMinY())} ${this.getMinY()} `;
                    } else if (previous.y > this.getMaxY()) {
                        d += `M ${this.findXCoordinateForY(previous, output, this.getMaxY())} ${this.getMaxY()} `;
                    }
                } else {
                    d += `L ${output.x} ${output.y} `;
                }
                previous = output;
            }

            // console.log(d)

            this.functionPaths[i].d = d;
        }
    }
}
