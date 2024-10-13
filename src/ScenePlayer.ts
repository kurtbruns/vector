import { Definitions, Frame, Group, Player, PlotGridBased, Point, Scene } from "../../vector/src";
import { SceneConfig } from "../../vector/src/Scene";

export interface ScenePlayerConfig extends SceneConfig {
    suffix?: string;
    width?: number;
    height?: number;
    root?: HTMLElement;
}

export class ScenePlayer extends Scene {

    margin: number;
    width: number;
    height: number;

    player:Player;

    constructor(config: ScenePlayerConfig = {}) {

        let defaultConfig: ScenePlayerConfig = {
            width: 500,
            height: 400,
            background: true,
        };

        config = { ...defaultConfig, ...config };

        config.root = config.root === undefined ? document.querySelector('#root') : config.root;

        super({
            root: config.root,
            width: config.width,
            height: config.height,
            responsive: false,
            background: config.background,
            suffix: config.suffix,
        });

        this.width = config.width;
        this.height = config.height;

        this.player = new Player({
            scene: this,
            id: this.constructor.name + (config.suffix ? config.suffix : '')
        });

    }

}