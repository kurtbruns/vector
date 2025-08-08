import { Player } from "./Player";
import { Scene, SceneConfig } from "./Scene";

export interface ScenePlayerConfig extends SceneConfig {
    name?: string;
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
            suffix: ""
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

        let name;
        if( config.name ) {
            name = config.name;
        } else {
            name = this.constructor.name;
        }
        

        this.player = new Player({
            scene: this,
            name: name + config.suffix
        });

    }

}