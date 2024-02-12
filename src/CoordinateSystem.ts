import { Definitions, ExportTarget, Group, Line, PlotGridBased, Point, TAU, TeX, download } from "./index";
import { Scene, SceneMode } from "./scene";

type PointTuple = [number, number]; // Define a tuple type for a point

export interface CoordinateSystemConfig {

    root?: HTMLElement;
    axes?: boolean;
    axesColor?: string;
    axesArrows?: boolean;
    axesLabels?: boolean;
    width?: number;
    height?: number;
    gridWidth?: number;
    gridHeight?: number;
    drawGrid?: boolean;
    big?: boolean;
    small?: boolean;
    suffix?: string;
    controls?: boolean;


}

export class CoordinateSystem extends Scene {

    width: number;
    height: number;

    internalX: number;
    internalY: number;
    internalWidth: number;
    internalHeight: number;

    axes: Group;

    defs: Definitions;
    plot: PlotGridBased;


    constructor(config: CoordinateSystemConfig = {}) {

        let defaultConfig: CoordinateSystemConfig = {
            axes: true,
            axesColor: 'var(--font-color-subtle)',
            axesArrows: true,
            axesLabels: true,
            width: 960,
            height: 540,
            gridWidth: 16,
            gridHeight: 9,
            drawGrid: true,
            big: false,
            suffix: ''
        };

        config = { ...defaultConfig, ...config };

        if (config.controls) {
            config.root = document.createElement('div');
        } else if (config.root === null) {
            config.root = document.querySelector('#root') as HTMLElement
        }

        super({
            root: config.root,
            width: config.width,
            height: config.height,
            suffix: config.suffix
        });

        if (config.controls) {
            CoordinateSystem.createContainer(config.root, this);
        }

        let frame = this.frame;
        this.defs = this.frame.defs();
        this.width = config.width;
        this.height = config.height;

        this.internalWidth = config.gridWidth;
        this.internalHeight = config.gridHeight;
        this.internalX = -this.internalWidth / 2;;
        this.internalY = -this.internalHeight / 2;;

        let plot = new PlotGridBased(frame.background.root, {
            x: 0,
            y: 0,
            width: this.width,
            height: this.height,
            internalX: this.internalX,
            internalY: this.internalY,
            internalWidth: this.internalWidth,
            internalHeight: this.internalHeight,
            responsive: false,
            grid: false,
        });
        this.plot = plot;

        if (config.drawGrid) {
            if (config.big) {
                plot.drawGridLines2();
            } else if (config.small) {
                plot.drawGridLines2(['small'], ['small'],
                    {
                        'small': 'primary',
                    });
            } else {
                plot.drawGridLines2(['small-half', 'small'], ['small-half', 'small'],
                    {
                        'small': 'primary',
                        'small-half': 'tertiary',
                    });
            }
        }

        let origin = this.plot.SVGToRelative(new Point(0, 0));
        if (config.axes) {
            this.axes = frame.group();
            let xAxis = this.axes.line(origin.x - this.width / 2, origin.y, origin.x + this.width / 2, origin.y);
            xAxis.setAttribute('stroke-width', '1.5');
            xAxis.setAttribute('stroke', config.axesColor);
            if (config.axesArrows) {
                xAxis.attatchArrow(this.defs, true, config.axesColor);
                xAxis.attatchArrow(this.defs, false, config.axesColor);
            }

            let yAxis = this.axes.line(origin.x, origin.y - this.height / 2, origin.x, origin.y + this.height / 2);
            yAxis.setAttribute('stroke-width', '1.5');
            yAxis.setAttribute('stroke', config.axesColor);
            if (config.axesArrows) {
                yAxis.attatchArrow(this.defs, true, config.axesColor);
                yAxis.attatchArrow(this.defs, false, config.axesColor);
            }

            if (config.axesLabels) {
                let b = this.plot.relativeToSVG(this.plot.SVGToRelative(new Point(0, 0)).x + 30, 0).x;
                let yLabel = frame.tex("y")
                    .alignCenter()
                    .moveTo(plot.SVGToRelative(0, this.internalHeight / 2 - b))
                    .setAttribute('color', config.axesColor);

                let xLabel = frame.tex("x")
                    .alignCenter()
                    .moveTo(plot.SVGToRelative(this.internalWidth / 2 - b, 0))
                    .setAttribute('color', config.axesColor);

                this.axes.appendChild(xLabel);
                this.axes.appendChild(yLabel);
            }
        }





    }

    static createContainer(root: HTMLElement, scene: CoordinateSystem) {

        let container = document.createElement('div');
        container.classList.add('player');

        document.querySelector('#root').append(container)

        let controls = document.createElement('div');
        controls.classList.add('controls')

        container.append(root, controls);

        let left = document.createElement('div');
        left.classList.add('left');
        let middle = document.createElement('div');
        middle.classList.add('middle');
        let right = document.createElement('div');
        right.classList.add('right')

        controls.append(left, middle, right);

        let playButton = document.createElement('button');
        playButton.title = 'Play';
        playButton.ariaLabel = 'Play';
        playButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path fill="var(--font-color-subtle)" d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/></svg>`;

        let skipButtonPlaceHolder = document.createElement('button');

        let captureButton = document.createElement('button');
        captureButton.title = 'Capture';
        captureButton.ariaLabel = 'Capture';
        captureButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path fill="var(--font-color-subtle)" d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm80-80h480v-320H240v320Zm-80 80v-480 480Z"/></svg>`;
        // captureButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path fill="var(--font-color-subtle)" d="M480-400q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0 80q66 0 113-47t47-113q0-66-47-113t-113-47q-66 0-113 47t-47 113q0 66 47 113t113 47ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z"/></svg>`

        let downloadButton = document.createElement('button');
        downloadButton.title = 'Download';
        downloadButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path  fill="var(--font-color-subtle)" d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>';

        left.append(playButton, skipButtonPlaceHolder);
        left.append
        // middle.classList.add('no-select')
        middle.style.color = `var(--medium)`;
        middle.innerHTML = scene.frame.root.id;
        right.append(captureButton, downloadButton);

        scene.setOnDone(() => {
            // playButton.innerHTML = 'reset';
        })

        playButton.onclick = () => {
            if (scene.reset) {
                scene.reset();
            }
            scene.setMode(SceneMode.Live);
            scene.start();
            // TODO: change to pause button
            // TODO: disable double start when pressed twice
            // TODO: on finish change button to reset
        }

        captureButton.onclick = () => {
            download(scene.frame.root, scene.frame.root.id, ExportTarget.FIGMA);
        }

        downloadButton.onclick = () => {
            scene.exportZip(scene.frame.getAttribute('id'));
        }

    }

    alignTexBy(s: string, ...args: TeX[]) {

        for (let i = 1; i < args.length; i++) {
            args[i].shift(args[0].getPartsByTex('=')[0].getBoundingClientRect().x - args[i].getPartsByTex('=')[0].getBoundingClientRect().x, 0);
        }

    }

    texVector(...args: any[]): string {

        return `\\begin{bmatrix} \\: ${args.join(`\\: \\\\ \\:`)} \\: \\end{bmatrix}`;

        // return `\\left[\\begin{array}{c} \\: ${args.join(`\\: \\\\ \\:`)} \\: \\end{array}\\right]`;
    }

    texVectorLabel(l:string): string {

        return `\\vec{\\mathbf{${l}}}`;
    }

    vectorTipLabel(point: Point, tex: string, color?: string, offset: number = 0, radius: number = 32): TeX {

        let t = this.frame.tex(tex);

        t.addDependency(point);
        t.update = () => {

            let x = point.x;
            let y = point.y;

            // Rest of your original method implementation
            let angle = Math.atan2(y, x) + offset;
            let r = radius;

            t.moveTo(this.plot.SVGToRelative(new Point(x, y)))
                .alignCenter()
                .shift(r * Math.cos(angle), -r * Math.sin(angle));
        }
        t.update();

        if (color) {
            t.setAttribute('color', color);
        }

        return t;
    }

    projection(w: Point, v: Point): Point {
        let scalarProjection = w.dot(v) / v.dot(v);
        return v.scale(scalarProjection);
    }

    labelAxes() {
        this.plot.getVerticalGridValues('small').forEach((value, key) => {
            if (value.x !== 0 || value.y !== 0) {
                this.frame.tex(key.toString())
                    .alignCenter()
                    .moveTo(this.plot.SVGToRelative(0, value.y));
            }
        });

        this.plot.getHorizontalGridValues('small').forEach((value, key) => {
            if (value.x !== 0 || value.y !== 0) {
                this.frame.tex(key.toString())
                    .alignCenter()
                    .moveTo(this.plot.SVGToRelative(value.x, 0));
            }
        });
    }

    vector(p1: Point, p2: Point, color: string = 'var(--primary)'): Line {

        let v = this.frame.line(0, 0, 0, 0);
        v.setAttribute('stroke-width', '1.5');
        v.setAttribute('stroke', color);
        v.attatchArrow(this.defs, false, color);
        v.update = () => {

            let fp1 = this.plot.SVGToRelative(p1.x, p1.y);
            let fp2 = this.plot.SVGToRelative(p2.x, p2.y);

            v.x1 = fp1.x;
            v.y1 = fp1.y;
            v.x2 = fp2.x;
            v.y2 = fp2.y;
        };
        v.addDependency(p1, p2);
        v.update();

        return v;
    }

    addlabel(line: Line, label: string, color: string = 'var(--font-color-subtle)') {
        let l = this.frame.tex(label, 0, 0)
            .alignCenter()
            .setAttribute('color', color) as TeX;

        l.addDependency(line);
        l.update = () => {
            l.moveTo({ x: line.x1 + (line.x2 - line.x1) / 2, y: line.y1 + (line.y2 - line.y1) / 2 });
        };
        l.update();
        return l;
    }

    lineBetweenPoints(p1: Point, p2: Point, color: string = 'var(--font-color-subtle)'): Line {

        let line = this.frame.line(0, 0, 0, 0);
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke', color);
        line.addDependency(p1, p2);
        line.update = () => {

            let fp1 = this.plot.SVGToRelative(p1.x, p1.y);
            let fp2 = this.plot.SVGToRelative(p2.x, p2.y);

            line.x1 = fp1.x;
            line.y1 = fp1.y;
            line.x2 = fp2.x;
            line.y2 = fp2.y;
        }
        line.update();
        return line;
    }

    brace(p1: Point, p2: Point, label?: string, reverse: boolean = false, color: string = 'var(--primary)', space: number = 4) {

        if (reverse) {
            this.frame.gridBrace(this.plot, p2, p1, space);
        } else {
            this.frame.gridBrace(this.plot, p1, p2, space);
        }

        if (label) {
            let l = this.frame.tex(label, 0, 0)
                .alignCenter();

            l.addDependency(p1, p2);
            l.update = () => {
                let mx = p1.x + (p2.x - p1.x) / 2;
                let my = p1.y + (p2.y - p1.y) / 2;

                const p = this.plot.SVGToRelative(mx, my);
                const a = Math.atan2(p2.y - p1.y, p2.x - p1.x) + TAU / 4 + (reverse ? TAU / 2 : 0);
                let buff = 42;
                l.moveTo({ x: p.x - buff * Math.cos(a), y: p.y + buff * Math.sin(a) });
            };
            l.update();
        }

    }

    vectorLine(v: Point, color: string = 'var(--font-color-subtle)'): Line {
        let line = this.frame.line(0, 0, 0, 0);
        line.addDependency(v);
        line.update = () => {
            const endpoints = this.findLineEndpoints(v, this.internalX, this.internalY, this.internalWidth, this.internalHeight);
            const p1 = this.plot.SVGToRelative(endpoints[0][0], endpoints[0][1]);
            const p2 = this.plot.SVGToRelative(endpoints[1][0], endpoints[1][1]);
            line.x1 = p1.x;
            line.y1 = p1.y;
            line.x2 = p2.x;
            line.y2 = p2.y;
        }
        line.update();
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '1.5');
        return line;

    }

    findLineEndpoints(v: Point, minX: number, minY: number, width: number, height: number): PointTuple[] {

        const x = v.x;
        const y = v.y;


        let potentialEndpoints: PointTuple[] = []; // Initialize array to hold potential endpoints
        let slope: number; // Variable to hold the slope

        // Calculate slope of the line
        if (x !== 0) { // Avoid division by zero for vertical lines
            slope = y / x;
        } else {
            slope = Infinity; // Infinite slope for vertical lines
        }

        // Check intersection with left and right viewbox boundaries
        const leftIntersectionY = slope * (minX); // x = minX for left boundary
        const rightIntersectionY = slope * (minX + width); // x = minX + width for right boundary

        // If the y-coordinates of left and right intersections are within the viewbox, add them to potential endpoints
        if (minY <= leftIntersectionY && leftIntersectionY <= minY + height) {
            potentialEndpoints.push([minX, leftIntersectionY]);
        }
        if (minY <= rightIntersectionY && rightIntersectionY <= minY + height) {
            potentialEndpoints.push([minX + width, rightIntersectionY]);
        }

        // Check intersection with top and bottom viewbox boundaries
        if (slope !== Infinity) { // Avoid division by zero for horizontal lines
            const bottomIntersectionX = minY / slope; // y = minY for bottom boundary
            const topIntersectionX = (minY + height) / slope; // y = minY + height for top boundary

            // If the x-coordinates of top and bottom intersections are within the viewbox, add them to potential endpoints
            if (minX <= bottomIntersectionX && bottomIntersectionX <= minX + width) {
                potentialEndpoints.push([bottomIntersectionX, minY]);
            }
            if (minX <= topIntersectionX && topIntersectionX <= minX + width) {
                potentialEndpoints.push([topIntersectionX, minY + height]);
            }
        }

        // Special handling for vertical lines (slope is Infinity)
        if (x === 0) {
            potentialEndpoints.push([0, minY], [0, minY + height]);
        }

        // Special handling for horizontal lines (y component is 0)
        if (y === 0) {
            potentialEndpoints.push([minX, 0], [minX + width, 0]);
        }

        // Reduce the number of endpoints to the two that are on different axes (x and y), if necessary
        if (potentialEndpoints.length > 2) {
            potentialEndpoints.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // Sort by x first, then by y
            return [potentialEndpoints[0], potentialEndpoints[potentialEndpoints.length - 1]]; // Take the first and last points
        } else {
            return potentialEndpoints; // Return the calculated endpoints
        }
    }

}
