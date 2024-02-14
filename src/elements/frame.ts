

// svg elements
import {
    BaseElement,
    Circle,
    Definitions,
    Group,
    Marker,
    SVG
} from './svg'

// input elements
import {
    Button,
    CheckBox,
    Control,
    ControlCircle,
    Input,
    HoverBox,
    RadioControl,
    Scrubber, ScrubberOptions,
    Slider, SliderOptions,
} from './input/'

// math elements
import { Label } from './visual/Label'
import { Tex } from './Tex';

import { PlotGridBased, Point, TAU, Theme } from '..';

export type alignment = 'left' | 'center' | 'right';

export interface FrameConfig {

    x?: number,
    y?: number,
    width?: number,
    height?: number
    maxWidth?: number,

    origin?: string;
    responsive?: boolean;
    align?: string | alignment;

}

/**
* This class exposes the high level functionality of our library. Elements can
* created and related together
*
* By default input elements are added to a SVG "controls" group and visual
* elements are added to the "background" group. This ensures that controls will
* alwaysbe focusable, despite the order in which elements are created.
*/
export class Frame extends SVG {

    private static theme : Theme;

    /**
    * The container element for this interactive.
    */
    container: Element;

    /**
    * The input groups sits on top of the background group and ensures that
    * input elements will always visually appear above background elements.
    */
    input: Group;

    /**
    * The background is where everything that is not a primary control is drawn.
    */
    background: Group;

    /**
    * This group contains symbols that can be reused within this interactive.
    */
    private symbols: Group;

    /**
    * Maps icon names to ids.
    */
    private icons: Set<string>;

    // definitions
    private _definitions: Definitions;

    /**
    * Constructs a new frame.
    */
    constructor(container: Element, config: FrameConfig = {}) {

        // default configuration
        let defaultConfig: FrameConfig = {
            width: (2 * 144),
            height: (2 * 144) / 16 * 9,
            align: 'left',
            origin: 'default',
            responsive: true
        };

        // Combine default with custom config
        config = { ...defaultConfig, ...config };

        // Construct the svg document 
        if (typeof config.x === 'number' && typeof config.y === 'number') {
            super(config.width, config.height, config.x, config.x)
        } else {
            super(config.width, config.height);
        }

        this.container = this.appendSelfWithin(container);

        // create and append the root svg element and group elements
        this.container.appendChild(this.root);
        this.root.classList.add('frame');

        // Have to create and manually append because overridden append child will
        // throw an error.
        this.background = new Group();
        this.input = new Group();
        this.root.appendChild(this.background.root);
        this.root.appendChild(this.input.root)

        Theme.getInstance();


        // // prevent the default behavior of selecting text
        // this.container.addEventListener('mousedown', function( event:MouseEvent ) {
        //   event.preventDefault();
        // });
    }

    /**
    * Returns definitions for this interactive. If undefined, creates and appends
    * a new element.
    *
    * TODO: move this up to the SVG level?
    */
    get definitions(): Definitions {
        if (this._definitions === undefined) {
            this._definitions = new Definitions();
            return super.prependChild(this._definitions);
        } else {
            return this._definitions;
        }
    }

    /**
    * Appends the element within the interactive. If the element is an "input"
    * element, places the element in the input group so that visually the element
    * is always placed above other graphical elements.
    */
    appendChild<T extends BaseElement>(child: T): T {
        if (child instanceof Input) {
            this.input.appendChild(child);
        } else {
            this.background.appendChild(child);
        }
        return child;
    }

    /**
     * Adds an arrow marker element to the defintions.
     */
    arrow(): Marker {
        let marker = this._definitions.marker(10, 5, 10, 10);
        marker.path('M 0 0 L 10 5 L 0 10 z').style.fill = '#404040';
        marker.setAttribute('orient', 'auto-start-reverse');
        return marker;
    }

    /**
     * 
     */
    tex(s: string, x: number = 0, y: number = 0, background: boolean = true): Tex {
        let tex = this.appendChild(new Tex(s, x, y));
        tex.setAttribute('id', s);
        if (background) {
            tex.drawBackground()
        }
        return tex;
    }

    brace(x1: number, y1: number, x2: number, y2: number): Group {

        // Braces with a height of 16 and the specified length 60, 90, 180 or 240
        const sizes: Map<number, string> = new Map();
        sizes.set(60, "M0.182678 -2.6147e-06C0.416678 -2.60447e-06 0.56566 0.106997 0.63266 0.320997C0.69866 0.533997 0.770656 0.904997 0.847656 1.432C0.925656 1.959 1.04067 2.419 1.19467 2.815C2.29367 5.679 4.47268 7.111 7.73068 7.111L21.7607 7.111C25.9057 7.111 28.5657 9.099 29.7427 13.074C30.9177 9.099 33.4447 7.111 37.3197 7.111L51.6587 7.111C52.6027 7.111 53.3167 7.078 53.7977 7.012C55.1477 6.781 56.3137 6.144 57.2967 5.098C58.2797 4.053 58.8677 2.757 59.0617 1.209C59.0617 1.176 59.0717 1.081 59.0907 0.926001C59.1097 0.770001 59.1287 0.658 59.1487 0.593C59.1677 0.526 59.1977 0.435999 59.2367 0.320999C59.2767 0.204999 59.3477 0.122999 59.4477 0.0739994C59.5477 0.0239994 59.6577 -1.49641e-08 59.7797 -9.63126e-09C60.2817 1.23119e-08 59.9257 3.667 58.7137 5.59C57.5007 7.512 55.7407 8.596 53.4327 8.84C53.0447 8.873 52.4727 8.889 51.7167 8.889L37.6097 8.889C36.2987 8.889 35.1517 9.107 34.1677 9.543C33.1847 9.98 32.4557 10.543 31.9837 11.235C31.5117 11.926 31.1697 12.507 30.9577 12.976C30.7457 13.445 30.5997 13.918 30.5247 14.396C30.5247 14.495 30.5137 14.639 30.4947 14.828C30.4757 15.017 30.4417 15.169 30.3937 15.285C30.3457 15.4 30.3027 15.516 30.2637 15.63C30.2257 15.746 30.1577 15.836 30.0607 15.902C29.9647 15.967 29.8577 16.001 29.7427 16.001C29.5887 16.001 29.4627 15.977 29.3667 15.927C29.2707 15.877 29.1977 15.787 29.1497 15.655C29.1017 15.524 29.0677 15.388 29.0487 15.248C29.0297 15.109 29.0007 14.923 28.9627 14.692C28.9237 14.461 28.8857 14.248 28.8467 14.05C28.5767 12.832 27.9697 11.733 27.0257 10.753C26.0797 9.774 24.8747 9.186 23.4097 8.988C23.0247 8.922 22.4457 8.889 21.6747 8.889L8.07767 8.889C7.30367 8.889 6.68566 8.86 6.22266 8.803C5.76066 8.746 5.11368 8.526 4.28268 8.143C3.45168 7.76 2.70568 7.202 2.04468 6.469C-0.151323 4.443 -0.199322 -2.6314e-06 0.182678 -2.6147e-06Z");
        sizes.set(90, "M0.123199 0.497066C0.380199 0.497066 0.545225 0.604066 0.618225 0.818066C0.691225 1.03107 0.770225 1.40207 0.855225 1.92907C0.941225 2.45607 1.06721 2.91606 1.23721 3.31206C2.44621 6.17606 4.84322 7.60807 8.42722 7.60807L35.8602 7.60807C40.4202 7.60807 43.3462 9.59607 44.6402 13.5711C45.9332 9.59607 48.7122 7.60807 52.9752 7.60807L80.7482 7.60807C81.7862 7.60807 82.5722 7.57507 83.1012 7.50907C84.5862 7.27807 85.8692 6.64107 86.9502 5.59507C88.0322 4.55007 88.6792 3.25406 88.8912 1.70606C88.8912 1.67306 88.9022 1.57807 88.9232 1.42307C88.9442 1.26707 88.9652 1.15506 88.9862 1.09006C89.0072 1.02306 89.0402 0.933069 89.0832 0.818069C89.1272 0.702069 89.2052 0.620068 89.3162 0.571068C89.4262 0.521068 89.5482 0.49707 89.6812 0.49707C90.2332 0.49707 89.8422 4.16407 88.5092 6.08707C87.1752 8.00907 85.2392 9.09307 82.7002 9.33707C82.2732 9.37007 81.6442 9.38607 80.8122 9.38607L53.2942 9.38607C51.8522 9.38607 50.5902 9.60406 49.5082 10.0401C48.4262 10.4771 47.6252 11.0401 47.1062 11.7321C46.5872 12.4231 46.2112 13.0041 45.9772 13.4731C45.7432 13.9421 45.5842 14.4151 45.5002 14.8931C45.5002 14.9921 45.4882 15.1361 45.4672 15.3251C45.4462 15.5141 45.4092 15.6661 45.3562 15.7821C45.3032 15.8971 45.2562 16.0131 45.2132 16.1271C45.1712 16.2431 45.0972 16.3331 44.9902 16.3991C44.8842 16.4641 44.7672 16.4981 44.6402 16.4981C44.4712 16.4981 44.3322 16.4741 44.2272 16.4241C44.1222 16.3741 44.0412 16.2841 43.9882 16.1521C43.9352 16.0211 43.8982 15.8851 43.8772 15.7451C43.8562 15.6061 43.8242 15.4201 43.7822 15.1891C43.7392 14.9581 43.6972 14.7451 43.6542 14.5471C43.3572 13.3291 42.6902 12.2301 41.6512 11.2501C40.6112 10.2711 39.2852 9.68307 37.6742 9.48507C37.2502 9.41907 36.6142 9.38607 35.7662 9.38607L8.81021 9.38607C7.95921 9.38607 7.2792 9.35707 6.7702 9.30007C6.2612 9.24307 5.5502 9.02306 4.6362 8.64006C3.7222 8.25706 2.90122 7.69907 2.17422 6.96607C-0.240775 4.94007 -0.294779 0.497066 0.126221 0.497066L0.123199 0.497066Z");
        sizes.set(180, "M0.19754 -7.85932e-06C0.45454 -7.84809e-06 0.619566 0.106991 0.692566 0.320991C0.765566 0.533991 0.844565 0.904999 0.929565 1.432C1.01557 1.959 1.14155 2.41899 1.31155 2.81499C2.52055 5.67899 4.91756 7.111 8.50156 7.111L80.9345 7.111C85.4945 7.111 88.4205 9.099 89.7145 13.074C91.0075 9.099 93.7866 7.111 98.0496 7.111L170.823 7.11101C171.861 7.11101 172.647 7.07801 173.176 7.01201C174.661 6.78101 175.944 6.14401 177.025 5.09801C178.107 4.05301 178.754 2.757 178.966 1.209C178.966 1.176 178.977 1.08101 178.998 0.92601C179.019 0.77001 179.04 0.658002 179.061 0.593002C179.082 0.526002 179.115 0.435999 179.158 0.320999C179.202 0.204999 179.28 0.123005 179.391 0.0740051C179.501 0.0240051 179.623 -1.64078e-08 179.756 -1.05942e-08C180.308 1.35345e-08 179.917 3.66701 178.584 5.59001C177.25 7.51201 175.314 8.59601 172.775 8.84001C172.348 8.87301 171.719 8.88901 170.887 8.88901L98.3686 8.889C96.9266 8.889 95.6645 9.107 94.5825 9.543C93.5005 9.98 92.6995 10.543 92.1805 11.235C91.6615 11.926 91.2855 12.507 91.0515 12.976C90.8175 13.445 90.6586 13.918 90.5746 14.396C90.5746 14.495 90.5626 14.639 90.5416 14.828C90.5206 15.017 90.4835 15.169 90.4305 15.285C90.3775 15.4 90.3305 15.516 90.2875 15.63C90.2455 15.746 90.1715 15.836 90.0645 15.902C89.9585 15.967 89.8415 16.001 89.7145 16.001C89.5455 16.001 89.4065 15.977 89.3015 15.927C89.1965 15.877 89.1156 15.787 89.0626 15.655C89.0096 15.524 88.9725 15.388 88.9515 15.248C88.9305 15.109 88.8985 14.923 88.8565 14.692C88.8135 14.461 88.7715 14.248 88.7285 14.05C88.4315 12.832 87.7646 11.733 86.7256 10.753C85.6856 9.774 84.3596 9.186 82.7486 8.988C82.3246 8.922 81.6885 8.889 80.8405 8.889L8.88455 8.889C8.03355 8.889 7.35354 8.86 6.84454 8.803C6.33554 8.746 5.62454 8.526 4.71054 8.143C3.79654 7.76 2.97557 7.202 2.24857 6.469C-0.166434 4.443 -0.220438 -7.87759e-06 0.200562 -7.85919e-06L0.19754 -7.85932e-06Z");
        sizes.set(240, "M0.196632 0.49706C0.445911 0.49706 0.605871 0.604074 0.6765 0.818074C0.747129 1.03107 0.823967 1.40207 0.906021 1.92907C0.989114 2.45607 1.1117 2.91606 1.2758 3.31206C2.44845 6.17606 4.77296 7.60808 8.24833 7.60808L110.692 7.60809C115.113 7.60809 117.952 9.59607 119.207 13.5711C120.46 9.59607 123.156 7.60809 127.289 7.60809L231.102 7.60809C232.108 7.60809 232.871 7.57509 233.384 7.50909C234.824 7.27809 236.068 6.64109 237.117 5.59509C238.166 4.55009 238.793 3.25409 238.999 1.70609C238.999 1.67309 239.009 1.5781 239.03 1.4231C239.051 1.2671 239.07 1.15509 239.091 1.09009C239.112 1.02309 239.143 0.933085 239.186 0.818085C239.228 0.702085 239.304 0.620075 239.411 0.571075C239.518 0.521075 239.635 0.49707 239.765 0.49707C240.3 0.49707 239.921 4.1641 238.628 6.0871C237.334 8.0091 235.457 9.0931 232.994 9.3371C232.58 9.3701 231.97 9.38608 231.163 9.38608L127.598 9.38607C126.2 9.38607 124.975 9.60406 123.926 10.0401C122.877 10.4771 122.1 11.0401 121.597 11.7321C121.093 12.4231 120.728 13.0041 120.502 13.4731C120.275 13.9421 120.121 14.4151 120.04 14.8931C120.04 14.9921 120.028 15.1361 120.007 15.3251C119.987 15.5141 119.951 15.6661 119.899 15.7821C119.848 15.8971 119.802 16.0131 119.761 16.1271C119.721 16.2431 119.648 16.3331 119.545 16.3991C119.442 16.4641 119.329 16.4981 119.206 16.4981C119.041 16.4981 118.907 16.4741 118.805 16.4241C118.702 16.3741 118.624 16.2841 118.573 16.1521C118.522 16.0211 118.486 15.8851 118.465 15.7451C118.444 15.6061 118.414 15.4201 118.373 15.1891C118.331 14.9581 118.29 14.7451 118.249 14.5471C117.961 13.3291 117.314 12.2301 116.306 11.2501C115.297 10.2711 114.011 9.68307 112.449 9.48507C112.038 9.41907 111.421 9.38607 110.598 9.38607L8.61706 9.38607C7.79133 9.38607 7.13282 9.35707 6.63841 9.30007C6.14505 9.24307 5.45536 9.02307 4.56835 8.64007C3.68133 8.25707 2.88573 7.69908 2.18048 6.96608C-0.161703 4.94008 -0.213655 0.49706 0.19454 0.49706L0.196632 0.49706Z");

        const length = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1);

        const sizesArray = Array.from(sizes.keys()).sort((a, b) => a - b);
        const smallerOrEqual = sizesArray.reverse().find(size => size <= length);

        const closest = (smallerOrEqual !== undefined) ? smallerOrEqual : sizesArray[sizesArray.length - 1];

        let group = this.group();
        group.setAttribute('transform', `translate(${x1}, ${y1}) rotate(${angle / Math.PI * 180}) scale(${length / closest}, 1) `);

        let path = group.path(sizes.get(closest));
        path.setAttribute('fill', 'var(--font-color)');

        return group;

    }

    /**
    * Creates a checkbox input at the position (x,y) within this interactive.
    */
    button(x: number, y: number, label: string): Button {
        return this.appendChild(new Button(x, y, label));
    }

    /**
    * Creates a checkbox input at the position (x,y) within this interactive.
    */
    checkBox(x: number, y: number, label: string, value: boolean): CheckBox {
        return this.appendChild(new CheckBox(x, y, label, value));
    }

    /**
    * Creates a checkbox input at the position (x,y) within this interactive.
    */
    radioControl(x: number, y: number, labels: string[], index: number = 0): RadioControl {
        return this.appendChild(new RadioControl(x, y, labels, index));
    }

    /**
    * Creates a control point within this interactive at the position (x,y).
    */
    control(x: number, y: number): Control {
        return this.appendChild(new Control(x, y));
    }

    gridPoint(plot: PlotGridBased, p: Point, color: string = 'var(--font-color)', radius: number = 3.5): Circle {

        let vbox = this.viewBox.split(/[\s,]+/).map(Number)
        let c = this.circle(0, 0, radius);
        c.setAttribute('fill', color);
        c.addDependency(p)
        c.update = () => {
            let relativePoint = plot.SVGToRelative(p.x, p.y);
            c.cx = relativePoint.x + vbox[0];
            c.cy = relativePoint.y + vbox[1];
        }
        c.update();


        return this.appendChild(c);
    }

    gridControlPoint(plot: PlotGridBased, p: Point, invisible: boolean = false): Control {

        let vbox = this.viewBox.split(/[\s,]+/).map(Number)

        let c = this.control(0, 0);
        c.addDependency(p)
        c.onchange = () => {

            let svgPoint = plot.relativeToSVG(c.x - vbox[0], c.y - vbox[1]);
            p.x = svgPoint.x;
            p.y = svgPoint.y;
            p.updateDependents();
        }

        c.update = () => {
            let relativePoint = plot.SVGToRelative(p.x, p.y);
            c.x = relativePoint.x + vbox[0];
            c.y = relativePoint.y + vbox[1];
        }
        c.update();

        if (invisible) {
            (c.root.firstChild as SVGElement).style.fill = 'none';
        }

        return this.appendChild(c);

    }

    gridBrace(plot: PlotGridBased, p1: Point, p2: Point, spacing: number = 0) {

        // Braces with a height of 16 and the specified length 60, 90, 180 or 240
        const sizes: Map<number, string> = new Map();
        sizes.set(60, "M0.182678 -2.6147e-06C0.416678 -2.60447e-06 0.56566 0.106997 0.63266 0.320997C0.69866 0.533997 0.770656 0.904997 0.847656 1.432C0.925656 1.959 1.04067 2.419 1.19467 2.815C2.29367 5.679 4.47268 7.111 7.73068 7.111L21.7607 7.111C25.9057 7.111 28.5657 9.099 29.7427 13.074C30.9177 9.099 33.4447 7.111 37.3197 7.111L51.6587 7.111C52.6027 7.111 53.3167 7.078 53.7977 7.012C55.1477 6.781 56.3137 6.144 57.2967 5.098C58.2797 4.053 58.8677 2.757 59.0617 1.209C59.0617 1.176 59.0717 1.081 59.0907 0.926001C59.1097 0.770001 59.1287 0.658 59.1487 0.593C59.1677 0.526 59.1977 0.435999 59.2367 0.320999C59.2767 0.204999 59.3477 0.122999 59.4477 0.0739994C59.5477 0.0239994 59.6577 -1.49641e-08 59.7797 -9.63126e-09C60.2817 1.23119e-08 59.9257 3.667 58.7137 5.59C57.5007 7.512 55.7407 8.596 53.4327 8.84C53.0447 8.873 52.4727 8.889 51.7167 8.889L37.6097 8.889C36.2987 8.889 35.1517 9.107 34.1677 9.543C33.1847 9.98 32.4557 10.543 31.9837 11.235C31.5117 11.926 31.1697 12.507 30.9577 12.976C30.7457 13.445 30.5997 13.918 30.5247 14.396C30.5247 14.495 30.5137 14.639 30.4947 14.828C30.4757 15.017 30.4417 15.169 30.3937 15.285C30.3457 15.4 30.3027 15.516 30.2637 15.63C30.2257 15.746 30.1577 15.836 30.0607 15.902C29.9647 15.967 29.8577 16.001 29.7427 16.001C29.5887 16.001 29.4627 15.977 29.3667 15.927C29.2707 15.877 29.1977 15.787 29.1497 15.655C29.1017 15.524 29.0677 15.388 29.0487 15.248C29.0297 15.109 29.0007 14.923 28.9627 14.692C28.9237 14.461 28.8857 14.248 28.8467 14.05C28.5767 12.832 27.9697 11.733 27.0257 10.753C26.0797 9.774 24.8747 9.186 23.4097 8.988C23.0247 8.922 22.4457 8.889 21.6747 8.889L8.07767 8.889C7.30367 8.889 6.68566 8.86 6.22266 8.803C5.76066 8.746 5.11368 8.526 4.28268 8.143C3.45168 7.76 2.70568 7.202 2.04468 6.469C-0.151323 4.443 -0.199322 -2.6314e-06 0.182678 -2.6147e-06Z");
        sizes.set(90, "M0.123199 0.497066C0.380199 0.497066 0.545225 0.604066 0.618225 0.818066C0.691225 1.03107 0.770225 1.40207 0.855225 1.92907C0.941225 2.45607 1.06721 2.91606 1.23721 3.31206C2.44621 6.17606 4.84322 7.60807 8.42722 7.60807L35.8602 7.60807C40.4202 7.60807 43.3462 9.59607 44.6402 13.5711C45.9332 9.59607 48.7122 7.60807 52.9752 7.60807L80.7482 7.60807C81.7862 7.60807 82.5722 7.57507 83.1012 7.50907C84.5862 7.27807 85.8692 6.64107 86.9502 5.59507C88.0322 4.55007 88.6792 3.25406 88.8912 1.70606C88.8912 1.67306 88.9022 1.57807 88.9232 1.42307C88.9442 1.26707 88.9652 1.15506 88.9862 1.09006C89.0072 1.02306 89.0402 0.933069 89.0832 0.818069C89.1272 0.702069 89.2052 0.620068 89.3162 0.571068C89.4262 0.521068 89.5482 0.49707 89.6812 0.49707C90.2332 0.49707 89.8422 4.16407 88.5092 6.08707C87.1752 8.00907 85.2392 9.09307 82.7002 9.33707C82.2732 9.37007 81.6442 9.38607 80.8122 9.38607L53.2942 9.38607C51.8522 9.38607 50.5902 9.60406 49.5082 10.0401C48.4262 10.4771 47.6252 11.0401 47.1062 11.7321C46.5872 12.4231 46.2112 13.0041 45.9772 13.4731C45.7432 13.9421 45.5842 14.4151 45.5002 14.8931C45.5002 14.9921 45.4882 15.1361 45.4672 15.3251C45.4462 15.5141 45.4092 15.6661 45.3562 15.7821C45.3032 15.8971 45.2562 16.0131 45.2132 16.1271C45.1712 16.2431 45.0972 16.3331 44.9902 16.3991C44.8842 16.4641 44.7672 16.4981 44.6402 16.4981C44.4712 16.4981 44.3322 16.4741 44.2272 16.4241C44.1222 16.3741 44.0412 16.2841 43.9882 16.1521C43.9352 16.0211 43.8982 15.8851 43.8772 15.7451C43.8562 15.6061 43.8242 15.4201 43.7822 15.1891C43.7392 14.9581 43.6972 14.7451 43.6542 14.5471C43.3572 13.3291 42.6902 12.2301 41.6512 11.2501C40.6112 10.2711 39.2852 9.68307 37.6742 9.48507C37.2502 9.41907 36.6142 9.38607 35.7662 9.38607L8.81021 9.38607C7.95921 9.38607 7.2792 9.35707 6.7702 9.30007C6.2612 9.24307 5.5502 9.02306 4.6362 8.64006C3.7222 8.25706 2.90122 7.69907 2.17422 6.96607C-0.240775 4.94007 -0.294779 0.497066 0.126221 0.497066L0.123199 0.497066Z");
        sizes.set(180, "M0.19754 -7.85932e-06C0.45454 -7.84809e-06 0.619566 0.106991 0.692566 0.320991C0.765566 0.533991 0.844565 0.904999 0.929565 1.432C1.01557 1.959 1.14155 2.41899 1.31155 2.81499C2.52055 5.67899 4.91756 7.111 8.50156 7.111L80.9345 7.111C85.4945 7.111 88.4205 9.099 89.7145 13.074C91.0075 9.099 93.7866 7.111 98.0496 7.111L170.823 7.11101C171.861 7.11101 172.647 7.07801 173.176 7.01201C174.661 6.78101 175.944 6.14401 177.025 5.09801C178.107 4.05301 178.754 2.757 178.966 1.209C178.966 1.176 178.977 1.08101 178.998 0.92601C179.019 0.77001 179.04 0.658002 179.061 0.593002C179.082 0.526002 179.115 0.435999 179.158 0.320999C179.202 0.204999 179.28 0.123005 179.391 0.0740051C179.501 0.0240051 179.623 -1.64078e-08 179.756 -1.05942e-08C180.308 1.35345e-08 179.917 3.66701 178.584 5.59001C177.25 7.51201 175.314 8.59601 172.775 8.84001C172.348 8.87301 171.719 8.88901 170.887 8.88901L98.3686 8.889C96.9266 8.889 95.6645 9.107 94.5825 9.543C93.5005 9.98 92.6995 10.543 92.1805 11.235C91.6615 11.926 91.2855 12.507 91.0515 12.976C90.8175 13.445 90.6586 13.918 90.5746 14.396C90.5746 14.495 90.5626 14.639 90.5416 14.828C90.5206 15.017 90.4835 15.169 90.4305 15.285C90.3775 15.4 90.3305 15.516 90.2875 15.63C90.2455 15.746 90.1715 15.836 90.0645 15.902C89.9585 15.967 89.8415 16.001 89.7145 16.001C89.5455 16.001 89.4065 15.977 89.3015 15.927C89.1965 15.877 89.1156 15.787 89.0626 15.655C89.0096 15.524 88.9725 15.388 88.9515 15.248C88.9305 15.109 88.8985 14.923 88.8565 14.692C88.8135 14.461 88.7715 14.248 88.7285 14.05C88.4315 12.832 87.7646 11.733 86.7256 10.753C85.6856 9.774 84.3596 9.186 82.7486 8.988C82.3246 8.922 81.6885 8.889 80.8405 8.889L8.88455 8.889C8.03355 8.889 7.35354 8.86 6.84454 8.803C6.33554 8.746 5.62454 8.526 4.71054 8.143C3.79654 7.76 2.97557 7.202 2.24857 6.469C-0.166434 4.443 -0.220438 -7.87759e-06 0.200562 -7.85919e-06L0.19754 -7.85932e-06Z");
        sizes.set(240, "M0.196632 0.49706C0.445911 0.49706 0.605871 0.604074 0.6765 0.818074C0.747129 1.03107 0.823967 1.40207 0.906021 1.92907C0.989114 2.45607 1.1117 2.91606 1.2758 3.31206C2.44845 6.17606 4.77296 7.60808 8.24833 7.60808L110.692 7.60809C115.113 7.60809 117.952 9.59607 119.207 13.5711C120.46 9.59607 123.156 7.60809 127.289 7.60809L231.102 7.60809C232.108 7.60809 232.871 7.57509 233.384 7.50909C234.824 7.27809 236.068 6.64109 237.117 5.59509C238.166 4.55009 238.793 3.25409 238.999 1.70609C238.999 1.67309 239.009 1.5781 239.03 1.4231C239.051 1.2671 239.07 1.15509 239.091 1.09009C239.112 1.02309 239.143 0.933085 239.186 0.818085C239.228 0.702085 239.304 0.620075 239.411 0.571075C239.518 0.521075 239.635 0.49707 239.765 0.49707C240.3 0.49707 239.921 4.1641 238.628 6.0871C237.334 8.0091 235.457 9.0931 232.994 9.3371C232.58 9.3701 231.97 9.38608 231.163 9.38608L127.598 9.38607C126.2 9.38607 124.975 9.60406 123.926 10.0401C122.877 10.4771 122.1 11.0401 121.597 11.7321C121.093 12.4231 120.728 13.0041 120.502 13.4731C120.275 13.9421 120.121 14.4151 120.04 14.8931C120.04 14.9921 120.028 15.1361 120.007 15.3251C119.987 15.5141 119.951 15.6661 119.899 15.7821C119.848 15.8971 119.802 16.0131 119.761 16.1271C119.721 16.2431 119.648 16.3331 119.545 16.3991C119.442 16.4641 119.329 16.4981 119.206 16.4981C119.041 16.4981 118.907 16.4741 118.805 16.4241C118.702 16.3741 118.624 16.2841 118.573 16.1521C118.522 16.0211 118.486 15.8851 118.465 15.7451C118.444 15.6061 118.414 15.4201 118.373 15.1891C118.331 14.9581 118.29 14.7451 118.249 14.5471C117.961 13.3291 117.314 12.2301 116.306 11.2501C115.297 10.2711 114.011 9.68307 112.449 9.48507C112.038 9.41907 111.421 9.38607 110.598 9.38607L8.61706 9.38607C7.79133 9.38607 7.13282 9.35707 6.63841 9.30007C6.14505 9.24307 5.45536 9.02307 4.56835 8.64007C3.68133 8.25707 2.88573 7.69908 2.18048 6.96608C-0.161703 4.94008 -0.213655 0.49706 0.19454 0.49706L0.196632 0.49706Z");

        let group = this.group();

        let path = group.path("");
        path.setAttribute('fill', 'var(--font-color)');

        group.addDependency(p1, p2);
        group.update = () => {

            let fp1 = plot.SVGToRelative(p1.x, p1.y);
            let fp2 = plot.SVGToRelative(p2.x, p2.y);
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

    /**
   * 
   */
    gridTex(plot: PlotGridBased, s: string, x: number = 0, y: number = 0, background: boolean = true): Tex {
        let p = plot.SVGToRelative(x, -y);
        let tex = this.appendChild(new Tex(s, p.x, p.y))
            .alignCenter();
        if (background) {
            tex.drawBackground()
        }
        return tex;
    }

    /**
    * Creates a control point within this interactive at the position (x,y).
    */
    controlCircle(x: number, y: number): Control {
        return this.appendChild(new ControlCircle(x, y));
    }

    hoverBox(str: string): HoverBox {
        return this.appendChild(new HoverBox(str));
    }

    label(x: number, y: number, str: string) {
        let label = this.appendChild(new Label(x, y, str));
        label.drawBackgroundRectangle();
        return label;
    }

    /**
    * Creates a slider input within this interactive
    */
    slider(x: number, y: number, options: SliderOptions): Slider {
        return this.appendChild(new Slider(x, y, options));
    }

    /**
    * Creates a scrubber with a play and pause button at the position (x,y).
    */
    scrubber(x: number, y: number, options: ScrubberOptions): Scrubber {
        return this.appendChild(new Scrubber(x, y, options));
    }
}
