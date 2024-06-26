import { CoordinateSystem, CoordinateSystemConfig } from "./CoordinateSystem";
import { Scene, SceneMode } from "./Scene";
import { ExportTarget, bundle, download, saveAs } from "./util";

export interface PlayerConfig {
    id?: string;
    root?: HTMLElement;
    scene?: Scene
}

export class Player {

    scene: Scene;

    static downloadTarget: ExportTarget = ExportTarget.FIGMA;

    private _downloadCallback: (scene: Scene) => void;
    private static _defaultDownloadCallback: (scene: Scene) => void = () => {
        console.log('No callback provided.')
    }

    container: HTMLElement;
    controls: HTMLElement;
    left: HTMLElement;
    middle: HTMLElement;
    right: HTMLElement;

    constructor(config: PlayerConfig = {}) {

        let defaultConfig: PlayerConfig = {
            id: '',
        };

        config = { ...defaultConfig, ...config };

        this.scene = config.scene;

        let container = document.createElement('div');
        container.classList.add('player');

        if (config.root) {
            config.root.append(container);
        } else {
            document.querySelector('#root').append(container);
        }

        container.style.margin = `2rem auto`;
        container.style.display = `flex`;
        container.style.flexDirection = `column`;
        container.style.maxWidth = `${this.scene.frame.width}px`;

        let controls = document.createElement('div');
        controls.classList.add('controls')

        container.append(this.scene.frame.root, controls);

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

        let downloadButton = document.createElement('button');
        downloadButton.title = 'Download';
        downloadButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path  fill="var(--font-color-subtle)" d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>';

        left.append(playButton, skipButtonPlaceHolder);
        middle.style.color = `var(--medium)`;

        right.append(captureButton, downloadButton);

        middle.innerHTML = config.id === '' ? this.scene.constructor.name : config.id;

        this.container = container;
        this.controls = controls;
        this.left = left;
        this.middle = middle;
        this.right = right;

        this.downloadCallback = Player._defaultDownloadCallback;

        this.scene.setOnDone(() => {
            // playButton.innerHTML = 'reset';
        })

        playButton.onclick = () => {
            // TODO: move functionality to scene class?
            if (this.scene.reset) {
                this.scene.reset();
            }
            this.scene.setMode(SceneMode.Live);
            this.scene.start();
            // TODO: change to pause button
            // TODO: disable double start when pressed twice
            // TODO: on finish change button to reset
        }

        captureButton.onclick = () => {
            let suffix = '';
            switch(Player.downloadTarget) {
                case ExportTarget.BROWSER:
                    suffix = '.browser.svg'
                    break;
                case ExportTarget.ILLUSTRATOR:
                    suffix = '.illustrator.svg'
                    break;
                default:
                    break;
            }
            download(this.scene.frame.root, this.scene.frame.root.id + suffix, Player.downloadTarget);
        }

        downloadButton.onclick = () => {
            if (this.scene.reset) {
                this.scene.reset();
            }
            this.downloadCallback(this.scene);
        }

    }

    static setDefaultDownloadCallback(fn: (scene: Scene) => void) {
        Player._defaultDownloadCallback = fn;
    }

    set downloadCallback(fn: (scene: Scene) => void) {
        this._downloadCallback = fn;
    }

    get downloadCallback(): (scene: Scene) => void {
        return this._downloadCallback;
    }

}

