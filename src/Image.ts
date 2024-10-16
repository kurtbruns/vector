import { Definitions, Frame, Group, Player, PlotGridBased, Point, Scene } from "../../vector/src";
import { SceneConfig } from "../../vector/src/Scene";

export interface ImageConfig extends SceneConfig {
    suffix?: string;
    width?: number;
    height?: number;
    root?: HTMLElement;
}

export class FrameImage {

    frame: Frame;

    constructor(config: ImageConfig = {}) {

        let defaultConfig: ImageConfig = {
            width: 640,
            height: 360,
            background: true,
        };

        config = { ...defaultConfig, ...config };

        config.root = config.root === undefined ? document.querySelector('#root') : config.root;

        this.frame = new Frame(config.root, {
            width: config.width,
            height: config.height,
            responsive: false,
        });

        this.frame.setAttribute('id', this.constructor.name + (config.suffix ? config.suffix : ''));

        if(config.background) {
            let rect = this.frame.rect(this.frame.x, this.frame.y, this.frame.width, this.frame.height);
            rect.setAttribute('fill', 'var(--background)')
        }

    }

}