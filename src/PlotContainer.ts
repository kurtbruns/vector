

import { Definitions, Frame, Group, PlotGridBased } from "./index";
import { Player } from "./Player";
import { Scene, SceneConfig } from "./Scene";

export interface PlotContainerConfig extends SceneConfig {
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
    margin?: number;
    labelAxes?: boolean;
}

export class PlotContainer extends Scene {

    width: number;
    height: number;

    // private internalX: number;
    // private internalY: number;
    // private internalWidth: number;
    // private internalHeight: number;

    internalX: number;
    internalY: number;
    internalWidth: number;
    internalHeight: number;

    axes: Group;

    defs: Definitions;
    container: Frame;
    plot: PlotGridBased;

    constructor(config: PlotContainerConfig = {}) {

        let defaultConfig: PlotContainerConfig = {
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
            margin: 50,
            labelAxes: true,
        };

        config = { ...defaultConfig, ...config };

        if (isNaN(config.internalX)) {
            config.internalX = -config.gridWidth / 2;
        }

        if (isNaN(config.internalY)) {
            config.internalY = -config.gridHeight / 2;
        }

        config.root = config.root === undefined ? document.querySelector('#root') : config.root;

        let margin = config.margin;
        let width = config.width + margin * 2;
        let height = config.height + margin * 2;

        super({
            root: config.root,
            width: width,
            height: height,
            responsive: false,
            background: true,
            suffix: config.suffix,
        });

        let frame = this.frame;
        this.defs = this.frame.defs();
        this.width = config.width;
        this.height = config.height;

        // TODO: this is weird to store these twice here and in the plot
        this.internalWidth = config.gridWidth;
        this.internalHeight = config.gridHeight;
        this.internalX = config.internalX;
        this.internalY = config.internalY;

        this.container = new Frame(frame.background.root, {
            width: width,
            height: height
        })

        let plot = new PlotGridBased(this.container.root, {
            x: margin,
            y: margin,
            width: width - 2 * margin,
            height: height - 2 * margin,
            internalX: this.internalX,
            internalY: this.internalY,
            internalWidth: this.internalWidth,
            internalHeight: this.internalHeight,
            responsive: false,
            grid: false,
        });
        this.plot = plot;

        new Player({

            scene: this,
            name: this.constructor.name + (config.suffix ? config.suffix : '')
        });

        if (config.labelAxes) {
        let xAxis = plot.getHorizontalValues('small');
        let yAxis = plot.getVerticalValues('small');

        let xGroup = this.container.group()

        Object.entries(xAxis).forEach(([key, value]) => {

            let point = value as SVGPoint;
            let label = this.frame.tex(key)
            label.alignCenter()
            label.moveTo(point.x + margin, this.container.height - 0.5 * margin)

        });

        let yGroup = this.container.group()

        Object.entries(yAxis).forEach(([key, value]) => {

            let point = value as SVGPoint;
            let label = this.frame.tex(key)
            label.alignCenter()
            label.moveTo(0.5 * margin, point.y + margin)
            });
        }
    }
}