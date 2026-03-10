import { Tex } from ".";
import { Group, Line } from "./elements/svg";
import { Point } from "./model";
import { Plot } from "./modules/plot";
import { ScenePlayer } from "./ScenePlayer";

export interface TransformationPlotConfig {
    drawBasislabels?: boolean;
    drawBasisVectors?: boolean;
    player?: boolean;
    drawGrid?: boolean;
    drawGridAxes?: boolean;
    drawTransformedGrid?: boolean;
    suffix?: string;
    viewportWidth?: number;
}

export class TransformationPlot extends ScenePlayer {

    origin: Point;
    i: Point;
    j: Point;
    iArrow: Line;
    jArrow: Line;
    iLabel: Tex;
    jLabel: Tex;

    plot: Plot;

    constructor(config: TransformationPlotConfig = {}) {

        let aspectRatio = 16 / 9;
        let defaultConfig: TransformationPlotConfig = {
            drawBasislabels: true,
            drawBasisVectors: true,
            drawGrid: true,
            drawGridAxes: true,
            drawTransformedGrid: true,
            viewportWidth: 40,
            player: true,
            suffix: ''
        };

        config = { ...defaultConfig, ...config };

        let width = 640;
        let height = width / aspectRatio;
        super({
            width: width,
            height: height,
        });

        let w = config.viewportWidth;
        let h = config.viewportWidth / aspectRatio;
        this.plot = new Plot(this.frame, {
            width: width,
            height: height,
            viewportX: -w / 2,
            viewportY: -h / 2,
            viewportWidth: w,
            viewportHeight: h,
        })

        this.origin = new Point(0, 0);
        this.i = new Point(1, 0);
        this.j = new Point(0, 1);

        if (config.drawGrid) {
            // this.plot.drawBorder()
            this.plot.drawGrid(
                [
                    this.plot.generateHorizontalValues('small'),
                    this.plot.generateHorizontalValues('half'),
                    this.plot.generateHorizontalValues('big')],
                [
                    this.plot.generateVerticalValues('small'),
                    this.plot.generateVerticalValues('half'),
                    this.plot.generateVerticalValues('big')
                ],
            )
        }

        if(config.drawGridAxes) {
            this.plot.drawAxes({axesColor:'var(--font-color-subtle'})
        }

        if (config.drawBasisVectors) {
            this.iArrow = this.plot.displayVector(this.i, 'var(--green)');
            this.jArrow = this.plot.displayVector(this.j, 'var(--red)');
        }

        if(config.drawBasislabels) {
            this.iLabel = this.plot.displayVectorLabel(this.i, '\\hat{\\imath}', {scale:0.5})
            this.iLabel.setAttribute('color', 'var(--green)')

            this.jLabel = this.plot.displayVectorLabel(this.j, '\\hat{\\jmath}', {scale:0.5})
            this.jLabel.setAttribute('color', 'var(--red)')
        }

        if (config.drawTransformedGrid) {
            // let plotWidth = this.plot.maxX - this.plot.minX;
            // let plotHeight = this.plot.maxY - this.plot.minY;
            // this.drawTransformedGrid(
            //     [
            //         this.plot.generateValues([this.plot.minX - plotWidth, this.plot.maxX + plotWidth], 'small'),
            //         this.plot.generateValues([this.plot.minX - plotWidth, this.plot.maxX + plotWidth], 'half'),
            //         this.plot.generateValues([this.plot.minX - plotWidth, this.plot.maxX + plotWidth], 'big'),
            //     ],
            //     [
            //         this.plot.generateValues([this.plot.minY - plotHeight, this.plot.maxY + plotHeight], 'small'),
            //         this.plot.generateValues([this.plot.minY - plotHeight, this.plot.maxY + plotHeight], 'half'),
            //         this.plot.generateValues([this.plot.minY - plotHeight, this.plot.maxY + plotHeight], 'big'),
            //     ]
            // );
            this.drawTransformedGridOversized();
        }



    }

    /**
     * Transforms a vector by applying the current linear transformation defined by the basis vectors i and j.
     * Creates a dependency relationship so the vector updates when basis vectors change.
     * @param v The vector point to transform
     * @returns The transformed vector point
     */

    transformVector(v: Point) {
        let i = this.i;
        let j = this.j;
        let c = v.copy();
        v.addDependency(i, j);
        v.update = () => {
            v.x = c.x * i.x + c.y * j.x;
            v.y = c.x * i.y + c.y * j.y;
        };
        v.update();
        return v;
    }

    private lineIntersection(
        p1: { x: number, y: number },
        p2: { x: number, y: number },
        p3: { x: number, y: number },
        p4: { x: number, y: number }
    ): { x: number, y: number } | null {
        const s1_x = p2.x - p1.x;
        const s1_y = p2.y - p1.y;
        const s2_x = p4.x - p3.x;
        const s2_y = p4.y - p3.y;

        const denominator = (-s2_x * s1_y + s1_x * s2_y);

        // Parallel lines (no intersection)
        if (denominator === 0) {
            return null;
        }

        const s = (-s1_y * (p1.x - p3.x) + s1_x * (p1.y - p3.y)) / denominator;
        const t = (s2_x * (p1.y - p3.y) - s2_y * (p1.x - p3.x)) / denominator;

        // Check if the intersection lies within the line segment p3-p4 (the rectangle edge)
        if (s >= 0 && s <= 1) {
            return {
                x: p1.x + (t * s1_x),
                y: p1.y + (t * s1_y)
            };
        }

        return null; // No intersection
    }

    findIntersection(A: Point, B: Point): { x: number, y: number }[] {

        // Define the rectangle bounds
        const minX = this.plot.minX;
        const maxX = this.plot.maxX;
        const minY = this.plot.minY;
        const maxY = this.plot.maxY;


        // Define the four edges of the rectangle
        const edges = [
            [{ x: minX, y: minY }, { x: maxX, y: minY }], // Bottom edge
            [{ x: maxX, y: minY }, { x: maxX, y: maxY }], // Right edge
            [{ x: maxX, y: maxY }, { x: minX, y: maxY }], // Top edge
            [{ x: minX, y: maxY }, { x: minX, y: minY }]  // Left edge
        ];

        const intersections: { x: number, y: number }[] = [];

        // Check for intersection with each edge
        for (const [p1, p2] of edges) {
            const intersection = this.lineIntersection(A, B, p1, p2);
            if (intersection) {
                intersections.push(intersection);
            }
        }

        // Return all unique intersections (at most two)
        if (intersections.length > 0) {
            // Filter out duplicate points (if any)
            const uniqueIntersections = intersections.filter(
                (point, index, self) =>
                    index === self.findIndex((p) => p.x === point.x && p.y === point.y)
            );

            return uniqueIntersections;
        }

        return null;
    }

    drawTransformedGrid(horizontalValues: number[][], verticalValues: number[][]) {

        let gridGroup = this.plot.grid.group();
        gridGroup.classList.add('non-scaling-stroke');
        gridGroup.setAttribute('stroke', 'var(--grid-primary)');
        gridGroup.setAttribute('stroke-width', '1.5px');

        let x1 = this.plot.minX;
        let x2 = this.plot.maxX

        let y1 = this.plot.minY;
        let y2 = this.plot.maxY;

        // horizontal grid lines
        let horizontalLines: Set<number> = new Set()
        let drawHorizontal = (g: Group) => {
            return (x: number) => {
                if (!horizontalLines.has(x)) {
                    let p1 = this.transformVector(new Point(x, y1));
                    let p2 = this.transformVector(new Point(x, y2));
                    let l = g.line(0, 0, 0, 0);
                    l.addDependency(p1, p2);
                    l.update = () => {

                        let t = this.findIntersection(p1, p2);

                        if (t !== null) {

                            let t1 = this.plot.viewportToFrame(t[0]);
                            let t2 = this.plot.viewportToFrame(t[1]);

                            l.x1 = t1.x;
                            l.y1 = t1.y;
                            l.x2 = t2.x;
                            l.y2 = t2.y;
                        } else {
                            l.x1 = 0;
                            l.y1 = 0;
                            l.x2 = 0;
                            l.y2 = 0;
                        }


                    }
                    l.update();
                    horizontalLines.add(x)
                }
            }
        }

        // vertical lines
        let verticalLines: Set<number> = new Set()
        let drawVertical = (g: Group) => {
            return (y: number) => {
                if (!verticalLines.has(y)) {
                    let p1 = this.transformVector(new Point(x1, y));
                    let p2 = this.transformVector(new Point(x2, y));
                    let l = g.line(0, 0, 0, 0);
                    l.addDependency(p1, p2);
                    l.update = () => {

                        let t = this.findIntersection(p1, p2);

                        if (t !== null) {

                            let t1 = this.plot.viewportToFrame(t[0]);
                            let t2 = this.plot.viewportToFrame(t[1]);

                            l.x1 = t1.x;
                            l.y1 = t1.y;
                            l.x2 = t2.x;
                            l.y2 = t2.y;
                        } else {
                            l.x1 = 0;
                            l.y1 = 0;
                            l.x2 = 0;
                            l.y2 = 0;
                        }


                    }
                    l.update();
                    verticalLines.add(y)
                }
            }
        }

        let mapping = [
            0.5,
            0.7,
            1.0,
        ]

        let xValues: number[];
        let yValues: number[];
        let opacity: number;
        do {
            xValues = horizontalValues.pop();
            yValues = verticalValues.pop();
            opacity = mapping.pop();

            if (xValues !== undefined) {
                let group = new Group();
                group.setAttribute('stroke', 'var(--blue)')
                group.setAttribute('opacity', opacity.toString())
                xValues.map(drawHorizontal(group));
                gridGroup.prependChild(group);
            }

            if (yValues !== undefined) {
                let group = new Group();
                group.setAttribute('stroke', 'var(--blue)')
                group.setAttribute('opacity', opacity.toString())
                yValues.map(drawVertical(group));
                gridGroup.prependChild(group);
            }

        } while (xValues !== undefined || yValues !== undefined)

    }

    drawTransformedGridOversized() {

        let plotWidth = this.plot.maxX - this.plot.minX;
        let plotHeight = this.plot.maxY - this.plot.minY;

        let horizontalValues = [
            this.plot.generateValues([this.plot.minX - plotWidth, this.plot.maxX + plotWidth], 'small'),
            this.plot.generateValues([this.plot.minX - plotWidth, this.plot.maxX + plotWidth], 'half'),
            this.plot.generateValues([this.plot.minX - plotWidth, this.plot.maxX + plotWidth], 'big'),
        ];

        let verticalValues = [
            this.plot.generateValues([this.plot.minY - plotHeight, this.plot.maxY + plotHeight], 'small'),
            this.plot.generateValues([this.plot.minY - plotHeight, this.plot.maxY + plotHeight], 'half'),
            this.plot.generateValues([this.plot.minY - plotHeight, this.plot.maxY + plotHeight], 'big'),
        ];

        let gridGroup = this.plot.grid.group();
        gridGroup.classList.add('non-scaling-stroke');
        gridGroup.setAttribute('stroke', 'var(--grid-primary)');
        gridGroup.setAttribute('stroke-width', '1.5px');

        let x1 = this.plot.minX - plotWidth;
        let x2 = this.plot.maxX + plotWidth;

        let y1 = this.plot.minY - plotHeight;
        let y2 = this.plot.maxY + plotHeight;

        // horizontal grid lines
        let horizontalLines: Set<number> = new Set()
        let drawHorizontal = (g: Group) => {
            return (x: number) => {
                if (!horizontalLines.has(x)) {
                    let p1 = this.transformVector(new Point(x, y1));
                    let p2 = this.transformVector(new Point(x, y2));
                    let l = g.line(0, 0, 0, 0);
                    l.addDependency(p1, p2);
                    l.update = () => {

                        // let t = this.findIntersection(p1, p2);
                        let t =[p1, p2];

                        if (t !== null) {

                            let t1 = this.plot.viewportToFrame(t[0]);
                            let t2 = this.plot.viewportToFrame(t[1]);

                            l.x1 = t1.x;
                            l.y1 = t1.y;
                            l.x2 = t2.x;
                            l.y2 = t2.y;
                        } else {
                            l.x1 = 0;
                            l.y1 = 0;
                            l.x2 = 0;
                            l.y2 = 0;
                        }


                    }
                    l.update();
                    horizontalLines.add(x)
                }
            }
        }

        // vertical lines
        let verticalLines: Set<number> = new Set()
        let drawVertical = (g: Group) => {
            return (y: number) => {
                if (!verticalLines.has(y)) {
                    let p1 = this.transformVector(new Point(x1, y));
                    let p2 = this.transformVector(new Point(x2, y));
                    let l = g.line(0, 0, 0, 0);
                    l.addDependency(p1, p2);
                    l.update = () => {

                        // let t = this.findIntersection(p1, p2);
                        let t =[p1, p2];

                        if (t !== null) {

                            let t1 = this.plot.viewportToFrame(t[0]);
                            let t2 = this.plot.viewportToFrame(t[1]);

                            l.x1 = t1.x;
                            l.y1 = t1.y;
                            l.x2 = t2.x;
                            l.y2 = t2.y;
                        } else {
                            l.x1 = 0;
                            l.y1 = 0;
                            l.x2 = 0;
                            l.y2 = 0;
                        }


                    }
                    l.update();
                    verticalLines.add(y)
                }
            }
        }

        let mapping = [
            0.5,
            0.7,
            1.0,
        ]

        let xValues: number[];
        let yValues: number[];
        let opacity: number;
        do {
            xValues = horizontalValues.pop();
            yValues = verticalValues.pop();
            opacity = mapping.pop();

            if (xValues !== undefined) {
                let group = new Group();
                group.setAttribute('stroke', 'var(--blue)')
                group.setAttribute('opacity', opacity.toString())
                xValues.map(drawHorizontal(group));
                gridGroup.prependChild(group);
            }

            if (yValues !== undefined) {
                let group = new Group();
                group.setAttribute('stroke', 'var(--blue)')
                group.setAttribute('opacity', opacity.toString())
                yValues.map(drawVertical(group));
                gridGroup.prependChild(group);
            }

        } while (xValues !== undefined || yValues !== undefined)

    }

}
