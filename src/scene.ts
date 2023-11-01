import JSZip from 'jszip';
import { Frame, ResponsiveFrame, bundle, saveAs } from '.'

/**
 * Different types of rate functions
 */
const EASING_FUNCTIONS = {
    'linear': (t: number) => t,
    'easeInOut': (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    // ... add other easing functions as needed
};

/**
 * Represents the rate function for the animation.
 */
export type EasingType = keyof typeof EASING_FUNCTIONS;


/**
 * Represents the function that defines how an animation progresses.
 */
export type AnimationFunction = (alpha: number) => void;

/**
 * Defines the structure of an animation with its properties.
 */
export type Animation = {
    animation: AnimationFunction,
    duration: number,
    type?: EasingType
};

export enum SceneMode {
    Live,
    Export
}

/**
 * A class to manage and control a series of animations.
 * 
 * It has the capability to schedule, play and wait for animations 
 * while providing flexibility to adjust their duration and type.
 * The animations are rendered onto a frame that is displayed 
 * in the browser. Easing functions can also be applied to control 
 * the rate of animations.
 */
export class Scene {

    private mode: SceneMode = SceneMode.Live;

    private fps: number = 60;

    /**
     * The array of animations that comprise the scene.
     */
    private animations: Animation[];

    /**
     * Keeps track of the current animation scene
     */
    private currentAnimation: number;

    /**
     * Keeps track of the current animation frame.
     */
    private currentAnimationFrame: number;

    /**
     * Front-end component that displays the current frame in the browser.
     */
    public frame: Frame;

    /**
     * Constructs a new scene instance.
     */
    constructor() {

        this.animations = [];
        this.currentAnimation = 0;
        this.currentAnimationFrame = 0;

        let root = document.querySelector('#root') as HTMLDivElement;

        let width = 960;
        let height = 540;

        this.frame = new ResponsiveFrame(root, {
            width: width,
            height: height,
        });

        let background = this.frame.background.rectangle(0, 0, width, height);
        background.style.fill = 'var(--background)'
    }

    /**
     * Sets the mode for the scene.
     */
    setMode(mode: SceneMode): void {
        this.mode = mode;
    }

    /**
     * Requests a new animation frame based on the current scene mode. 
     * If the scene mode is live, it will use the browser's requestAnimationFrame.
     * Otherwise, it will manually increment the current animation frame by a fixed time 
     * and then execute the provided frameCallback.
     * 
     * @param {FrameRequestCallback} callback - The callback to be executed upon receiving a new animation frame.
     * @param {() => void} [frameCallback] - Optional callback to be executed for manual frame updates in Export mode.
     */
    private requestFrame(callback: FrameRequestCallback, frameCallback?: () => void) {
        if (this.mode === SceneMode.Live) {
            requestAnimationFrame(callback);
        } else {
            frameCallback()
            callback(this.currentAnimationFrame + 1000 / this.fps)
        }
    }


    /**
     * Executes the current animation in the scene's animation sequence.
     * 
     * It uses the defined easing function to modify the animation's progress and continues
     * the animation loop until the current animation's duration has passed.
     * 
     * @param {number} timestamp - The current time of the animation in milliseconds.
     * @param {number} [previousTimestamp] - The timestamp of the last animation frame.
     * @param {() => void} [frameCallback] - Optional callback to be executed for manual frame updates in Export mode.
     * @param {() => void} [doneCallback] - Optional callback to be executed once all animations in the sequence are completed.
     */
    private runAnimation(timestamp: number, previousTimestamp?: number, frameCallback?: () => void, doneCallback?: () => void) {
        const animation = this.animations[this.currentAnimation];
        const rateFunc = EASING_FUNCTIONS[animation.type || 'linear'];

        if (!previousTimestamp) {
            previousTimestamp = timestamp;
        }

        const elapsed = this.mode === SceneMode.Live
            ? timestamp - previousTimestamp
            : 1000 / this.fps;

        this.currentAnimationFrame += elapsed;

        if (this.currentAnimationFrame <= animation.duration) {
            const alpha = rateFunc(this.currentAnimationFrame / animation.duration);
            animation.animation(alpha);
            this.requestFrame(ts => this.runAnimation(ts, timestamp, frameCallback, doneCallback), frameCallback)
        } else {
            animation.animation(1);
            this.currentAnimationFrame = 0;
            this.currentAnimation++;

            if (this.currentAnimation < this.animations.length) {
                this.requestFrame(ts => this.runAnimation(ts, timestamp, frameCallback, doneCallback), frameCallback)
            } else {
                if (doneCallback) {
                    doneCallback();
                }
            }
        }
    }

    /**
     * Exports the animation sequence as a Promise that resolves upon the completion of the entire sequence.
     */
    export(frameCallback: () => void): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.runAnimation(0, undefined, frameCallback, resolve);
            } catch (error) {
                reject(error);
            }
        });
    }

    exportZip(filename: string = 'frames') {

        this.setMode(SceneMode.Export);
        const zip = new JSZip();
        let count = 0;

        const frameCallback = () => {
            zip.file(`frame${count++}.svg`, bundle(this.frame.root));
        };

        this
            .export(frameCallback)
            .then(() => {
                zip.generateAsync({ type: 'blob' }).then(function (content) {
                    saveAs(content, `${filename}`, {});
                });
            })
            .catch((error) => {
                console.error('An error occurred:', error);
            });
    }

    /**
     * Begins playing all animations in the scene.
     */
    start(): void {
        this.runAnimation(0);
    }

    /**
     * Schedules a pause in the animation sequence for the specified duration (in seconds) before proceeding to the next animation. This is counted as an animation in the sequence of animations in the scene.
     */
    wait(duration: number): void {
        this.animations.push({
            duration: duration * 1000,
            animation: (alpha: number) => { },
        });
    }

    /**
     * Schedule a play animation for the provided duration in seconds.
     */
    play(animations: AnimationFunction[], duration: number, type: EasingType = 'easeInOut'): void {
        this.animations.push({
            duration: duration * 1000,
            animation: (alpha: number) => {
                animations.forEach(animation => animation(alpha));
            },
            type: type
        });
    }
}

