import { alignment } from "./Frame";
import { ResponsiveFrame } from "./ResponsiveFrame";

import { Rectangle } from "./svg/rectangle";
import { Group } from "./svg/group";
import { SVG } from "./svg";
import { Point } from "../model";

/**
 * Configuration passed the the plot constructor
 */
export interface GridConfiguration {

    // These dimensions affect the visible area of the plot
    x?: number
    y?: number
    width?: number
    height?: number
    maxWidth?: number

    // These dimensions affect the coordinate system used for plotting
    internalX?: number
    internalY?: number
    internalWidth?: number
    internalHeight?: number

    // Toggles weather the plot fills the available space of the container
    responsive?: boolean

    title?: string
    align?: alignment
    origin?: string
    border?: boolean

}

/**
 * A grid object allows a user to specify an internal coordinate system used for drawing.  
 */
export class Grid extends ResponsiveFrame {

    /**
     * Contains the grid lines
     */
    gridGroup: Group;

    /**
     * Contains the axis lines
     */
    axisGroup: Group;

    /**
     * Foreground
     */
    foreground: Group;

    /**
     * 
     */
    border: Rectangle;

    /**
     * 
     */
    backgroundRectangle: Rectangle;

    private ctm : DOMMatrix;
    private bbox : DOMRect;

    /**
     * Nested SVG to fix firefox bug with viewbox
     */
    private internalSVG: SVG;
    private internalViewBox: SVGAnimatedRect;

    /**
     * Contructs a SVG plot within the corresponding HTML Element and draws a plot of the function.
     */
    constructor(container: Element, config: GridConfiguration) {

        // Default values 
        let defaultConfig: GridConfiguration = {

            // view port
            x: 0,
            y: 0,
            width: 600,
            height: 300,

            // internal coordinates
            internalX: -300,
            internalY: -150,
            internalWidth: 600,
            internalHeight: 300,

            align: 'left',
            origin: 'default',
            responsive: true,
            border: true
        }

        // choose users config over default
        config = { ...defaultConfig, ...config };

        // if no max-width specified, default to specified width if responsive is set to false
        if (!config.maxWidth && !config.responsive) {
            config.maxWidth = config.width
        };

        super(container, config);

        this.classList.add('grid');
        this.x = config.x;
        this.y = config.y;

        // Inject style for gridlines
        let styleElement = document.createElement('style');
        styleElement.textContent = '.non-scaling-stroke line, path { vector-effect: non-scaling-stroke; }';
        this.definitions.root.appendChild(styleElement);

        // Create an internal SVG to do the heavy lifting
        this.setViewBox(config.internalX, config.internalY, config.internalWidth, config.internalHeight);
        let svg = this.appendChild(new SVG());
        svg.classList.add('ignore-on-export')
        this.internalViewBox = this.root.viewBox;

        // Store a reference to fix firefox viewbox issue
        if (navigator.userAgent.indexOf("Firefox") > -1) {
            this.internalSVG = svg.appendChild(new SVG());
        } else {
            this.internalSVG = svg as SVG;
        }

        this.gridGroup = this.group();
        this.axisGroup = this.group();
        this.foreground = this.group();

        this.backgroundRectangle = new Rectangle(config.internalX, config.internalY, config.internalWidth, config.internalHeight);
        this.backgroundRectangle.style.fill = 'transparent';
        this.backgroundRectangle.stroke = 'none';
        this.root.prepend(this.backgroundRectangle.root)


        // TODO: draw axis

    }

    setBoundingRect() {
        this.bbox = this.backgroundRectangle.root.getBoundingClientRect();
    }

    releaseBoundingRect() {
        this.bbox = null;
    }

    setCTM() {
        this.ctm = this.internalSVG.root.getScreenCTM();
    }

    releaseCTM() {
        this.ctm = null;
    }

    getInternalSVG(): SVG {
        return this.internalSVG;
    }

    /**
     * Converts a point in the screen's coordinate system into the SVG's coordinate system
     */
    screenToSVG(screenX: number, screenY: number) : DOMPoint {

        let svg = this.internalSVG.root;
        let p = svg.createSVGPoint();
        p.x = screenX;
        p.y = screenY;

        let point = p.matrixTransform(svg.getScreenCTM().inverse())
        point.y = -point.y;
        return point;
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
        let bbox = this.backgroundRectangle.root.getBoundingClientRect();

        // Add the bounding box's top left corner to get to absolute screen coordinates
        let absoluteScreenX = relative.x + bbox.left;
        let absoluteScreenY = relative.y + bbox.top;

        // Now we can use the screenToSVG method to convert to SVG coordinates
        return this.screenToSVG(absoluteScreenX, absoluteScreenY);
    }

    /**
     * Converts a point in the SVG's coordinate system to the *absolute* screen coordindate
     */
    SVGToScreen(svgX: number, svgY: number) {

        let svg = this.internalSVG.root;
        let p = svg.createSVGPoint()
        p.x = svgX
        p.y = svgY
        return p.matrixTransform(svg.getScreenCTM());
    }


    /**
     * Converts a point in the SVG's coordinate system to the relative screen coordinate.
     * Overload that accepts separate x and y coordinates.
     * @param svgX - The x-coordinate in the SVG's coordinate system.
     * @param svgY - The y-coordinate in the SVG's coordinate system.
     * @returns The point in the relative screen coordinate system.
     */
    SVGToRelative(svgX: number, svgY: number): DOMPoint;

    /**
     * Converts a point in the SVG's coordinate system to the relative screen coordinate.
     * Overload that accepts a Point object.
     * @param point - The Point object in the SVG's coordinate system.
     * @returns The point in the relative screen coordinate system.
     */
    SVGToRelative(point: {x:number, y:number}): DOMPoint;

    SVGToRelative(svgXOrPoint: number | {x:number, y:number}, svgY?: number): DOMPoint {
        // Implementation detail: Determine argument type and assign appropriate point values
        let pointToUse: Point | {x:number, y:number};

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
        let bbox;
        if( this.bbox ) {
            bbox = this.bbox;
        } else {
            bbox = this.backgroundRectangle.root.getBoundingClientRect();
        }

        let svg = this.internalSVG.root;

        let ctm;
        if (this.ctm) {
            ctm = this.ctm;
        } else {
            ctm = svg.getScreenCTM();
        }

        let p = svg.createSVGPoint();
        p.x = pointToUse.x; 
        p.y = -pointToUse.y;
        let convertedPoint = p.matrixTransform(ctm);
        convertedPoint.x -= bbox.left;
        convertedPoint.y -= bbox.top;

        // Return the point relative to the screen
        return convertedPoint;
    }


    drawBackground(fill: string = '#ffffff') {
        let viewbox = this.root.viewBox.baseVal
        let background = this.prependChild(this.rectangle(viewbox.x, viewbox.y, viewbox.width, viewbox.height));
        background.style.fill = fill;
        background.style.stroke = 'none';
    }

    /**
     * Draws a border around the plot SVG that does not change the dimensions of the plot object.
     */
    drawBorder() {

        // Or use clipping path
        let spacing = 0;
        let viewbox = this.root.viewBox.baseVal

        this.border = new Rectangle(viewbox.x, viewbox.y, viewbox.width, viewbox.height);
        this.border.appendSelfWithin(this.root);

        this.border.root.setAttribute('vector-effect', 'non-scaling-stroke');
        this.border.style.strokeWidth = '2';
        return this.border;
    }

    generateValues(range, magnitude: string = 'big'): number[] {

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

        let step;
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

    /**
    * Draws grid lines
    */
    drawGridLines(xBreaks = ['small', 'half', 'big'], yBreaks = ['small', 'half', 'big'], mapping : any = {}) {

        let defaultMapping = {
            'big': {
                'stroke': 'var(--grid-primary)'
            },
            'half': {
                'stroke': 'var(--grid-secondary)'
            },
            'small': {
                'stroke': 'var(--grid-tertiary)'
            },
            'small-half': {
                'stroke': 'var(--grid-quaternary)'
            },
            'tiny': {
                'stroke': 'var(--grid-quinary)'
            },
        };

        mapping = {...defaultMapping, ...mapping};

        // let blueMapping = {
        //     'big': {
        //         'stroke': 'var(--blue)'
        //     },
        //     'half': {
        //         'stroke': 'var(--blue)',
        //         'opacity': '0.8'
        //     },
        //     'small': {
        //         'stroke': 'var(--blue)',
        //         'opacity': '0.4'
        //     },
        // }

        let viewBox = this.internalViewBox.baseVal;

        this.gridGroup.classList.add('non-scaling-stroke');        
        this.gridGroup.setAttribute('stroke-width', '1.5px');
        
        let x1 = viewBox.x;
        let y1 = viewBox.y;
        let x2 = viewBox.x + viewBox.width;
        let y2 = viewBox.y + viewBox.height;

        // horizontal grid lines
        let horizontalLines: Set<number> = new Set()
        let drawHorizontal = (g: Group) => {
            return (x: number) => {
                if (!horizontalLines.has(x)) {
                    g.line(x, y1, x, y2);
                    horizontalLines.add(x)
                }
            }
        }

        // vertical lines
        let verticalLines: Set<number> = new Set()
        let drawVertical = (g: Group) => {
            return (y: number) => {
                if (!verticalLines.has(y)) {
                    g.line(x1, y, x2, y)
                    verticalLines.add(y)
                }
            }
        }

        let xBreak: string;
        let yBreak: string;
        do {
            xBreak = xBreaks.pop();
            yBreak = yBreaks.pop();

            if (xBreak !== undefined) {
                let group = new Group();
                // group.classList.add(mapping[xBreak]);
                group.setAttribute('stroke', mapping[xBreak]['stroke']);
                this.generateValues([x1, x2], xBreak).map(drawHorizontal(group));
                this.gridGroup.prependChild(group);
            }

            if (yBreak !== undefined) {
                let group = new Group();
                // group.classList.add(mapping[yBreak]);
                group.setAttribute('stroke', mapping[yBreak]['stroke']);
                this.generateValues([y1, y2], yBreak).map(drawVertical(group))
                this.gridGroup.prependChild(group);
            }

        } while (xBreak !== undefined || yBreak !== undefined)

    }

}
