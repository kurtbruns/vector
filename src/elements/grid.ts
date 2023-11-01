import { alignment } from "./frame";
import { ResponsiveFrame } from "./responsive";

import { Rectangle } from "../elements/svg/rectangle";
import { Group } from "../elements/svg/group";
import { SVG } from "../elements/svg";

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

  /**
   * Nested SVG to fix firefox bug with viewbox
   */
  private internalSVG: SVG;
  private internalViewBox: SVGAnimatedRect;

  /**
   * Contructs a SVG plot within the corresponding HTML Element and draws a plot of the function.
   */
  constructor(container:Element, config: GridConfiguration) {

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
    if (!config.maxWidth && !config.responsive) { config.maxWidth = config.width };

    super(container, config);

    this.classList.add('grid');
    this.x = config.x;
    this.y = config.y;

    // Create an internal SVG to do the heavy lifting
    this.setViewBox(config.internalX, config.internalY, config.internalWidth, config.internalHeight);
    let svg = this.appendChild(new SVG());
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

  getInternalSVG(): SVG {
    return this.internalSVG;
  }

  /**
   * Converts a point in the screen's coordinate system into the SVG's coordinate system
   */
  screenToSVG(screenX: number, screenY: number) {

    let svg = this.internalSVG.root;
    let p = svg.createSVGPoint()
    p.x = screenX
    p.y = screenY
    return p.matrixTransform(svg.getScreenCTM().inverse());
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
   * Converts a point in the SVG's coordinate system to the *relative* screen coordindate
   */
  SVGToRelative(svgX: number, svgY: number) {

    // TODO: test of something is drawn outside of the initial bounding box, that it still returns the correct relative point
    // TODO: if a user draws something outside of the region, this returns a bounding box including whatever crazy dimensions they have drawn!!
    // TODO: maybe have a mirrored SVG or another approach
    // let bbox = this.root.getBoundingClientRect();
    let bbox = this.backgroundRectangle.root.getBoundingClientRect();
    let svg = this.internalSVG.root;
    let p = svg.createSVGPoint()
    p.x = svgX;
    p.y = svgY;
    let point = p.matrixTransform(svg.getScreenCTM())
    point.x -= bbox.left;
    point.y -= bbox.top;
    return point;
    
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

  /**
   * Draws grid lines
   */
  drawGridLines() {

    let viewBox = this.internalViewBox.baseVal;

    this.gridGroup.setAttribute('class', 'grid-lines')
    let group3 = this.gridGroup.group();
    let group2 = this.gridGroup.group();
    let group1 = this.gridGroup.group();

    group1.setAttribute('class', 'primary')
    group2.setAttribute('class', 'secondary')
    group3.setAttribute('class', 'tertiary')

    // group3.style.opacity = '0.08'
    // group2.style.opacity = '0.16'
    // group1.style.opacity = '0.24'

    // group3.style.opacity = '0.15'
    // group2.style.opacity = '0.25'
    // group1.style.opacity = '0.4'

    // group1.style.stroke = 'var(--grid--primary)'
    // group2.style.stroke = 'var(--grid--secondary)'
    // group3.style.stroke = 'var(--grid--tertiary)'

    let x1 = Math.floor(viewBox.x);
    let y1 = Math.floor(viewBox.y);

    let x2 = Math.ceil(viewBox.x + viewBox.width);
    let y2 = Math.ceil(viewBox.y + viewBox.height);

    for (let x = x1; x <= x2; x++) {
      if (x % 10 === 0) {
        group1.line(x, y1, x, y2);
      } else if (x % 5 === 0) {
        group2.line(x, y1, x, y2);
      } else {
        group3.line(x, y1, x, y2);
      }
    }

    for (let y = y1; y <= y2; y++) {

      if (y % 10 === 0) {
        group1.line(x1, y, x2, y);
      } else if (y % 5 === 0) {
        group2.line(x1, y, x2, y);
      } else {
        group3.line(x1, y, x2, y);
      }
    }

    // let startY = Math.ceil(p1.y*10);
    // let endY = Math.ceil(p2.y*10);
    // for( let i = startY; i < endY; i+= 10) {
    // 	let y = i/10;
    // 	if( i % 10 === 0 ) {
    // 		group1.line(p1.x, y, p2.x, y);
    // 	} else if( i % 5 === 0) {
    // 		group2.line(p1.x, y, p2.x, y);
    // 	} else {
    // 		group3.line(p1.x, y, p2.x, y);
    // 	}
    // }
  }

  generateValues(range, magnitude: string = 'big') : number[] {

    const [start, end] = range;
    const rangeSize = end - start;
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

    const values : number[] = [];
    let currentValue = Math.ceil(start / step) * step;

    while (currentValue <= end) {
      values.push(Number(currentValue.toFixed(10)));
      currentValue += step;
    }

    return values;
  }

  generateValues2(range, magnitude: string = 'big') : number[] {

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

  generateValues3(range, magnitude: string = 'big') : number[] {

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
      // case 'small-half':
      //   step = baseStep / 20;
      //   break;
      case 'tiny':
        step = baseStep / 50;
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
  * TODO: seems problematic that this method creates the gridline groups. What if the user wanted to redraw the grid lines?
  */
  drawGridLines2(xBreaks = ['small', 'half', 'big'], yBreaks = ['small', 'half', 'big'], mapping : any = { 'big': 'primary', 'half': 'secondary', 'small': 'tertiary', 'small-half': 'quaternary', 'tiny': 'quinary', }) {

    let viewBox = this.internalViewBox.baseVal;

    this.gridGroup.setAttribute('class', 'grid-lines')

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

    // TODO: since the new and improved generateValues2, it seems like the gridline logic is attached
    // the the whole view port instead of each individual axis, so it makes sense to maybe have one
    // set of breakpoints here?

    let xBreak : string;
    let yBreak : string;
    do {
      xBreak = xBreaks.pop();
      yBreak = yBreaks.pop();

      if (xBreak !== undefined) {
        let group = new Group();
        group.classList.add(mapping[xBreak]);
        this.generateValues2([x1, x2], xBreak).map(drawHorizontal(group));
        this.gridGroup.prependChild(group);
      }

      if (yBreak !== undefined) {
        let group = new Group();
        group.classList.add(mapping[yBreak]);
        this.generateValues2([y1, y2], yBreak).map(drawVertical(group))
        this.gridGroup.prependChild(group);
      }

    } while (xBreak !== undefined || yBreak !== undefined)

  }

  /**
  * Draws grid lines
  * TODO: seems problematic that this method creates the gridline groups. What if the user wanted to redraw the grid lines?
  */
  drawGridLines3(xBreaks = ['small', 'half', 'big'], yBreaks = ['small', 'half', 'big'], mapping = { 'big': 'primary', 'half': 'secondary', 'small': 'tertiary', 'smallHalf': 'quaternary', 'tiny': 'quinary', }) {

    let viewBox = this.internalViewBox.baseVal;

    this.gridGroup.setAttribute('class', 'grid-lines')

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

    // TODO: since the new and improved generateValues2, it seems like the gridline logic is attached
    // the the whole view port instead of each individual axis, so it makes sense to maybe have one
    // set of breakpoints here?

    let xBreak : string;
    let yBreak : string;
    do {
      xBreak = xBreaks.pop();
      yBreak = yBreaks.pop();

      if (xBreak !== undefined) {
        let group = new Group();
        group.classList.add(mapping[xBreak]);
        this.generateValues3([x1, x2], xBreak).map(drawHorizontal(group));
        this.gridGroup.prependChild(group);
      }

      if (yBreak !== undefined) {
        let group = new Group();
        group.classList.add(mapping[yBreak]);
        this.generateValues3([y1, y2], yBreak).map(drawVertical(group))
        this.gridGroup.prependChild(group);
      }

    } while (xBreak !== undefined || yBreak !== undefined)


  }

}
