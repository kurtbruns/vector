import { Definitions, Group, Line, Path, PlotGridBased, Point, TAU, Tex } from "./index";
import { Player } from "./Player";
import { Scene, SceneConfig } from "./Scene";

type PointTuple = [number, number]; // Define a tuple type for a point

export interface CoordinateSystemConfig extends SceneConfig {
    suffix?: string;
    width?: number;
    height?: number;
    axesColor?: string;
    axesArrows?: boolean;
    axesLabels?: boolean;
    gridWidth?: number;
    gridHeight?: number;
    internalX?: number;
    internalY?: number;
    drawGrid?: boolean;
    drawAxes?: boolean;
    big?: boolean;
    half?: boolean;
    root?: HTMLElement;
    player?: boolean;
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
            width: 960,
            height: 540,
            axesColor: 'var(--font-color-subtle)',
            axesArrows: true,
            axesLabels: true,
            gridWidth: 16,
            gridHeight: 9,
            drawGrid: true,
            big: false,
            half: false,
        };

        config = { ...defaultConfig, ...config };

        if (isNaN(config.internalX)) {
            config.internalX = -config.gridWidth / 2;
        }

        if (isNaN(config.internalY)) {
            config.internalY = -config.gridHeight / 2;
        }

        config.root = config.root === undefined ? document.querySelector('#root') : config.root;

        super({
            root: config.root,
            width: config.width,
            height: config.height,
            responsive: false,
            background: true,
            suffix: config.suffix,
        });

        let frame = this.frame;
        this.defs = this.frame.defs();
        this.width = config.width;
        this.height = config.height;

        this.internalWidth = config.gridWidth;
        this.internalHeight = config.gridHeight;
        this.internalX = config.internalX;
        this.internalY = config.internalY;

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
            if (config.big && !config.half) {
                plot.drawGridLines();
            } else if (config.big && config.half) {
                plot.drawGridLines(
                    ['half', 'big'],
                    ['half', 'big'],
                    {
                        'big': { 'stroke': 'var(--grid-primary)' },
                        'second': { 'stroke': 'var(--grid-secondary)' },
                    });
            }
            else if (!config.half) {
                plot.drawGridLines(
                    ['small'],
                    ['small'],
                    {
                        'small': { 'stroke': 'var(--grid-primary)' },
                    });
            } else {
                plot.drawGridLines(
                    ['small-half', 'small'],
                    ['small-half', 'small'],
                    {
                        'small': { 'stroke': 'var(--grid-primary)' },
                        'small-half': { 'stroke': 'var(--grid-tertiary)' },
                    });
            }
        }

        if (config.drawAxes) {
            this.drawAxes(config.axesArrows, config.axesColor, config.axesLabels)
        }

        if (config.player) {
            new Player({
                scene: this,
                id: this.constructor.name + (config.suffix ? config.suffix : '')
            });
        }

    }

    drawAxes(axesArrows: boolean, axesColor = 'var(--font-color-subtle)', axesLabels = true) {

        let origin = this.plot.SVGToRelative(new Point(0, 0));
        let p1 = this.plot.SVGToRelative(this.internalX, -this.internalY);
        let p2 = this.plot.SVGToRelative(this.internalX + this.internalWidth, -(this.internalY + this.internalHeight));
        this.axes = this.frame.group();
        let xAxis = this.axes.line(p1.x, origin.y, p2.x, origin.y);
        xAxis.setAttribute('stroke-width', '1.5');
        xAxis.setAttribute('stroke', axesColor);
        if (axesArrows) {
            xAxis.attatchArrow(this.defs, true, axesColor);
            xAxis.attatchArrow(this.defs, false, axesColor);
        }

        let yAxis = this.axes.line(origin.x, p1.y, origin.x, p2.y);
        yAxis.setAttribute('stroke-width', '1.5');
        yAxis.setAttribute('stroke', axesColor);
        if (axesArrows) {
            yAxis.attatchArrow(this.defs, true, axesColor);
            yAxis.attatchArrow(this.defs, false, axesColor);
        }

        if (axesLabels) {
            let b = this.internalWidth / 20;
            let yLabel = this.frame.tex("y")
                .alignCenter()
                .moveTo(this.plot.SVGToRelative(0, -this.internalY - b))
                .setAttribute('color', axesColor);

            let xLabel = this.frame.tex("x")
                .alignCenter()
                .moveTo(this.plot.SVGToRelative(this.internalX + this.internalWidth - b, 0))
                .setAttribute('color', axesColor);

            this.axes.appendChild(xLabel);
            this.axes.appendChild(yLabel);
        }
    }

    projection(w: Point, v: Point): Point {
        let scalarProjection = w.dot(v) / v.dot(v);
        return v.copy().scale(scalarProjection);
    }

    texVector(...args: any[]): string {
        return `\\left[\\begin{array}{c} \\: ${args.join(`\\: \\\\ \\:`)} \\: \\end{array}\\right]`;
    }

    texVectorLabel(l: string): string {

        return `\\vec{\\mathbf{${l}}}`;
    }

    vectorLabel(v: Point, tex: string, opts: { color?: string, scale?: number } = {}): Tex {

        let options: {
            color: string,
            scale: number,
        } = {
            color: 'var(--font-color)',
            scale: 1,
        }

        options = { ...options, ...opts }

        let t = this.frame.tex(tex);

        t.addDependency(v);
        t.update = () => {

            let x = v.x;
            let y = v.y;


            t.moveTo(this.plot.SVGToRelative(v.add(v.normalize().scale(options.scale))))
                .alignCenter()
        }
        t.update();

        t.setAttribute('color', options.color);

        return t;
    }

    vectorTipLabel(point: Point, tex: string, color?: string, offset: number = 0, r = 24): Tex {

        let t = this.frame.tex(tex);

        t.addDependency(point);
        t.update = () => {

            let x = point.x;
            let y = point.y;

            // Rest of your original method implementation
            let angle = Math.atan2(y, x) + offset;

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

    vectorVariables(point: Point, color?: string, offset: number = 0, vars: [string, string] = ['x', 'y']): Tex {

        let x = point.x;
        let y = point.y;

        // Rest of your original method implementation
        let angle = Math.atan2(y, x) + offset;
        let r = 24;

        let tex = this.frame.tex(`\\begin{bmatrix} \\: ${vars[0]} \\: \\\\ \\: ${vars[1]} \\: \\end{bmatrix}`)
            .moveTo(this.plot.SVGToRelative(new Point(x, y)))
            .alignCenter()
            .shift(r * Math.cos(angle), -r * Math.sin(angle));

        if (color) {
            tex.setAttribute('color', color);
        }

        return tex;
    }

    vectorCoordinatesTex(point: Point, color?: string, offset: number = 0, radius: number = 40, prefix: string = ''): Tex {

        let x = point.x;
        let y = point.y;

        // Rest of your original method implementation
        let angle = Math.atan2(y, x) + offset;
        let r = radius;

        let tex = this.frame.tex(`${prefix}\\begin{bmatrix} \\: ${x.toString()} \\: \\\\ \\: ${y.toString()} \\: \\end{bmatrix}`)
            .moveTo(this.plot.SVGToRelative(new Point(x, y)))
            .alignCenter()
            .shift(r * Math.cos(angle), -r * Math.sin(angle));

        if (color) {
            tex.setAttribute('color', color);
        }

        return tex;
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

    updateArrow(element: Path | Line, color: string) {

        element.setAttribute('stroke', color);

        let marker;
        if (marker = element.getAttribute('marker-start')) {
            const id = marker.match(/url\(#(.+?)\)/)[1];
            document.getElementById(id).firstElementChild.setAttribute('fill', color);
        }

        if (marker = element.getAttribute('marker-end')) {
            const id = marker.match(/url\(#(.+?)\)/)[1];
            document.getElementById(id).firstElementChild.setAttribute('fill', color);
        }
    }

    vector(p1: Point, p2: Point, color: string = 'var(--font-color)'): Line {
        let v = this.frame.line(0, 0, 0, 0);
        v.setAttribute('stroke-width', '1.5');
        v.setAttribute('stroke', color);
        let m = v.attatchArrow(this.defs, false, color);
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

    line(p1: Point, p2: Point, color: string = 'var(--primary)'): Line {

        let v = this.frame.line(0, 0, 0, 0);
        v.setAttribute('stroke-width', '1.5');
        v.setAttribute('stroke', color);
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

    controlPath(): Path {
        let c0 = this.frame.control(this.frame.width / 2, this.frame.height / 2);
        let c1 = this.frame.control(this.frame.width / 2 + 100, this.frame.height / 2);
        let c2 = this.frame.control(this.frame.width / 2 + 100, this.frame.height / 2 + 100);
        (c2.root.firstChild as SVGElement).style.fill = 'none';
        (c2.root.children[1] as SVGElement).setAttribute('stroke-opacity', '0.5');

        let p = this.frame.path(``);
        p.addDependency(c0, c1, c2);
        p.update = () => {
            p.d = `M ${c0.x} ${c0.y} Q ${c1.x} ${c1.y} ${c2.x} ${c2.y}`;
        };
        p.update();

        p.setAttribute('stroke', 'var(--main)')
        p.setAttribute('stroke-width', '1.5')
        this.pathArrow(p)
        return p;
    }

    controlLine(): Path {
        let c0 = this.frame.control(this.frame.width / 2, this.frame.height / 2);
        let c1 = this.frame.control(this.frame.width / 2 + 100, this.frame.height / 2);
        (c1.root.firstChild as SVGElement).style.fill = 'none';
        (c1.root.children[1] as SVGElement).setAttribute('stroke-opacity', '0.5');

        let p = this.frame.path(``);
        p.addDependency(c0, c1);
        p.update = () => {
            p.d = `M ${c0.x} ${c0.y} L ${c1.x} ${c1.y}`;
        };
        p.update();

        p.setAttribute('stroke', 'var(--main)')
        p.setAttribute('stroke-width', '1.5')
        this.pathArrow(p)
        return p;
    }

    pathArrow(path: Path, color: string = 'var(--font-color)'): Group {

        const refX = 6;
        const refY = 5;
        let scale = 1.5;
        let strokeWidth;
        if (strokeWidth = path.getAttribute('stroke-width')) {
            scale = Number(strokeWidth.replace(/px$/, ''));
        }

        let g = this.frame.group();
        g.appendChild(path);
        let a = g.path(``);
        a.setAttribute('stroke', color);
        a.setAttribute('stroke-linecap', 'round');

        a.addDependency(path);
        a.update = () => {
            const length = path.getTotalLength();
            const p1 = path.getPointAtLength(length - refX)
            const p2 = path.getPointAtLength(length)

            const x = p2.x;
            const y = p2.y;
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);


            const adjustedX = x - (refX * scale) * Math.cos(angle) + (refY * scale) * Math.sin(angle);
            const adjustedY = y - (refX * scale) * Math.sin(angle) - (refY * scale) * Math.cos(angle);

            a.d = `M 0 0.5 L 6 5 L 0 9.5 `;
            a.setAttribute('transform', `translate(${adjustedX},${adjustedY}) rotate(${angle * (180 / Math.PI)}) scale(${scale})`);
        };
        a.update();



        return g;

    }

    arrow(start: Point, end: Point, color: string = 'var(--font-color)'): Line {

        const p1 = this.plot.SVGToRelative(start);
        const p2 = this.plot.SVGToRelative(end);

        let g = this.frame.group();
        let v = g.line(0, 0, 0, 0);
        v.setAttribute('stroke-width', '1.5');
        v.setAttribute('stroke', color);
        v.setAttribute('stroke-linecap', 'round')

        const refX = 6;
        const refY = 5;
        const scale = 1.25;
        const x = p2.x;
        const y = p2.y;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        const adjustedX = x - (refX * scale) * Math.cos(angle) + (refY * scale) * Math.sin(angle);
        const adjustedY = y - (refX * scale) * Math.sin(angle) - (refY * scale) * Math.cos(angle);

        let a = g.path(`M 0 0.5 L 6 5 L 0 9.5 `)
            .setAttribute('stroke', color)
            .setAttribute('stroke-linecap', 'round')
            .setAttribute('transform', `translate(${adjustedX},${adjustedY}) rotate(${angle * (180 / Math.PI)}) scale(${scale})`);

        v.update = () => {

            let fp1 = this.plot.SVGToRelative(start.x, start.y);
            let fp2 = this.plot.SVGToRelative(end.x, end.y);

            v.x1 = fp1.x;
            v.y1 = fp1.y;
            v.x2 = fp2.x;
            v.y2 = fp2.y;
        };
        v.addDependency(start, end);
        v.update();
        return v;
    }

    label(point: Point, label: string, color: string = 'var(--font-color)', offset = 0): Tex {

        let x = point.x;
        let y = point.y;

        // Rest of your original method implementation
        let angle = Math.atan2(y, x) + offset;
        let r = 24;

        let tex = this.frame.tex(label)
            .moveTo(this.plot.SVGToRelative(new Point(x, y)))
            .alignCenter()
            .shift(r * Math.cos(angle), -r * Math.sin(angle));

        tex.setAttribute('color', color);

        return tex;
    }

    addlabel(line: Line, label: string, color: string = 'var(--font-color)') {
        let l = this.frame.tex(label, 0, 0)
            .alignCenter()
            .setAttribute('color', color) as Tex;

        l.addDependency(line);
        l.update = () => {
            l.moveTo({ x: line.x1 + (line.x2 - line.x1) / 2, y: line.y1 + (line.y2 - line.y1) / 2 });
        };
        l.update();
        return l;
    }

    lineBetweenPoints(p1: Point, p2: Point, color: string = 'var(--font-color)'): Line {

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

    brace(p1: Point, p2: Point, label?: string, reverse: boolean = false, color: string = 'var(--primary)', space: number = 4): Tex {

        if (reverse) {
            this.frame.gridBrace(this.plot, p2, p1, space);
        } else {
            this.frame.gridBrace(this.plot, p1, p2, space);
        }

        if (label) {
            let l = this.frame.tex(label, 0, 0);
            l.alignCenter();

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
            return l;
        } else {
            return null;
        }

    }

    regularBraceLabel(p1: Point, p2: Point, label: string, opts = {}): Tex {

        let options: { reverse?: Boolean, space?: number, color?: string, buff?: number, group?: Group } = {
            reverse: false,
            color: 'var(--primary)',
            space: 4,
            buff: 42
        }

        options = { ...options, ...opts };

        let g = options.group ? options.group : this.frame.group();
        if (options.reverse) {
            g.appendChild(this.frame.brace(p1.x, p1.y, p2.x, p2.y));
        } else {
            g.appendChild(this.frame.brace(p2.x, p2.y, p1.x, p1.y));
        }

        let l = this.frame.tex(label, 0, 0)
            .alignCenter();

        g.appendChild(l);

        l.addDependency(p1, p2);
        l.update = () => {
            let mx = p1.x + (p2.x - p1.x) / 2;
            let my = p1.y + (p2.y - p1.y) / 2;

            const a = Math.atan2(my, mx) + TAU / 4 + (options.reverse ? 0 : TAU / 2);
            l.moveTo({ x: mx - options.buff * Math.cos(a), y: my + options.buff * Math.sin(a) });
        };
        l.update();

        return l;

    }

    private getEncompassingBoundingClientRectangle(elements: SVGElement[]): DOMRect {

        // Initialize variables to track the min and max x and y coordinates
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        // Iterate over all elements to find their bounding client rectangles
        elements.forEach(element => {
            let bbox = element.getBoundingClientRect();
            minX = Math.min(minX, bbox.left);
            minY = Math.min(minY, bbox.top);
            maxX = Math.max(maxX, bbox.right);
            maxY = Math.max(maxY, bbox.bottom);
        });

        // Create a new bounding client rectangle that includes all elements
        return new DOMRect(minX, minY, maxX - minX, maxY - minY);

    }

    braceLabelAbove(texParts: SVGElement[], label: string, options: { reverse?: Boolean, space?: number, color?: string, buff?: number, group?: Group } = {}) {

        let defaultOptions = {
            reverse: true,
            color: 'var(--primary)',
            space: 6,
            buff: 42
        }

        options = { ...defaultOptions, ...options };

        let bbox = this.getEncompassingBoundingClientRectangle(texParts);

        let domPoint1 = this.plot.absoluteToSVG(new Point(bbox.left, bbox.top));
        let domPoint2 = this.plot.absoluteToSVG(new Point(bbox.right, bbox.top));

        let p1 = new Point(domPoint1.x, domPoint1.y);
        let p2 = new Point(domPoint2.x, domPoint2.y);

        let g = options.group ? options.group : this.frame.group();
        if (options.reverse) {
            g.appendChild(this.frame.gridBrace(this.plot, p2, p1, options.space));
        } else {
            g.appendChild(this.frame.gridBrace(this.plot, p1, p2, options.space));
        }

        if (options.color) {
            g.setAttribute('fill', options.color);
        }

        let l = this.frame.tex(label, 0, 0)
            .alignCenter();

        g.appendChild(l);

        l.addDependency(p1, p2);
        l.update = () => {
            let mx = p1.x + (p2.x - p1.x) / 2;
            let my = p1.y + (p2.y - p1.y) / 2;

            const p = this.plot.SVGToRelative(mx, my);
            const a = Math.atan2(p2.y - p1.y, p2.x - p1.x) + TAU / 4 + (options.reverse ? TAU / 2 : 0);
            l.moveTo({ x: p.x - options.buff * Math.cos(a), y: p.y + options.buff * Math.sin(a) });
        };
        l.update();

        return l;

    }

    braceLabelBelow(texParts: SVGElement[], label: string, options: { reverse?: Boolean, space?: number, color?: string, buff?: number, group?: Group } = {}) {

        let defaultOptions = {
            reverse: false,
            color: 'var(--primary)',
            space: 6,
            buff: 42
        }

        options = { ...defaultOptions, ...options };

        let bbox = this.getEncompassingBoundingClientRectangle(texParts);

        let domPoint1 = this.plot.absoluteToSVG(new Point(bbox.left, bbox.bottom));
        let domPoint2 = this.plot.absoluteToSVG(new Point(bbox.right, bbox.bottom));

        let p1 = new Point(domPoint1.x, domPoint1.y);
        let p2 = new Point(domPoint2.x, domPoint2.y);

        let g = options.group ? options.group : this.frame.group();
        if (options.reverse) {
            g.appendChild(this.frame.gridBrace(this.plot, p2, p1, options.space));
        } else {
            g.appendChild(this.frame.gridBrace(this.plot, p1, p2, options.space));
        }

        if (options.color) {
            g.setAttribute('fill', options.color);
        }

        let l = this.frame.tex(label, 0, 0)
            .alignCenter();

        g.appendChild(l);

        l.addDependency(p1, p2);
        l.update = () => {
            let mx = p1.x + (p2.x - p1.x) / 2;
            let my = p1.y + (p2.y - p1.y) / 2;

            const p = this.plot.SVGToRelative(mx, my);
            const a = Math.atan2(p2.y - p1.y, p2.x - p1.x) + TAU / 4 + (options.reverse ? TAU / 2 : 0);
            l.moveTo({ x: p.x - options.buff * Math.cos(a), y: p.y + options.buff * Math.sin(a) });
        };
        l.update();

        return l;

    }

    braceLabel2(p1: Point, p2: Point, label: string, opts = {}): Tex {

        let options: { reverse?: Boolean, space?: number, color?: string, buff?: number, group?: Group } = {
            reverse: false,
            color: 'var(--primary)',
            space: 4,
            buff: 42
        }

        options = { ...options, ...opts };

        let g = options.group ? options.group : this.frame.group();
        if (options.reverse) {
            g.appendChild(this.frame.gridBrace(this.plot, p2, p1, options.space));
        } else {
            g.appendChild(this.frame.gridBrace(this.plot, p1, p2, options.space));
        }

        if (options.color) {
            g.setAttribute('fill', options.color);
        }

        let l = this.frame.tex(label, 0, 0)
            .alignCenter();

        g.appendChild(l);

        l.addDependency(p1, p2);
        l.update = () => {
            let mx = p1.x + (p2.x - p1.x) / 2;
            let my = p1.y + (p2.y - p1.y) / 2;

            const p = this.plot.SVGToRelative(mx, my);
            const a = Math.atan2(p2.y - p1.y, p2.x - p1.x) + TAU / 4 + (options.reverse ? TAU / 2 : 0);
            l.moveTo({ x: p.x - options.buff * Math.cos(a), y: p.y + options.buff * Math.sin(a) });
        };
        l.update();

        return l;

    }

    // TODO: remove and update all to use the behavior of braceLabel2
    braceLabel(p1: Point, p2: Point, label: string, reverse: boolean = false, color: string = 'var(--primary)', space: number = 4, buff: number = 42): Tex {

        let g = this.frame.group();
        if (reverse) {
            g.appendChild(this.frame.gridBrace(this.plot, p2, p1, space));
        } else {
            g.appendChild(this.frame.gridBrace(this.plot, p1, p2, space));
        }

        let l = this.frame.tex(label, 0, 0)
            .alignCenter();

        g.appendChild(l);

        l.addDependency(p1, p2);
        l.update = () => {
            let mx = p1.x + (p2.x - p1.x) / 2;
            let my = p1.y + (p2.y - p1.y) / 2;

            const p = this.plot.SVGToRelative(mx, my);
            const a = Math.atan2(p2.y - p1.y, p2.x - p1.x) + TAU / 4 + (reverse ? TAU / 2 : 0);
            l.moveTo({ x: p.x - buff * Math.cos(a), y: p.y + buff * Math.sin(a) });
        };
        l.update();

        return l;

    }


    vectorLine(v: Point): Line {
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
        line.setAttribute('stroke', 'var(--font-color)')
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
