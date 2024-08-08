import { Frame, Rectangle, ResponsiveFrame } from '.'

/**
 * Different types of rate functions
 */
const EASING_FUNCTIONS = {
    'wait': () => 0,
    'linear': (t: number) => t,
    'easeInOut': (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    'easeIn': (t: number) => t * t,
    'easeOut': (t: number) => t * (2 - t),
    // ... add other easing functions as needed
};

/**
 * Represents the rate function for the animation.
 */
export type AnimationType = keyof typeof EASING_FUNCTIONS;


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
    type?: AnimationType
};

export enum SceneMode {
    Live,
    Export
}

export interface SceneConfig {
    root?: HTMLElement;
    width?: number;
    height?: number;
    background?: boolean;
    responsive?: boolean;
    suffix?: string;
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

    /**
     * Export or Live mode
     */
    private mode: SceneMode;

    /**
     * Frames per second.
     */
    private _fps: number;

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
     * Function to be called when the scene is done
     */
    private onDoneCallback?: () => void;

    /**
     * Function to call to reset the scene
     */
    private _reset: () => void;

    /**
     * True if there currently is an animation sequence playing.
     */
    private active: boolean;

    /**
     * Front-end component that displays the current frame in the browser.
     */
    public frame: Frame;

    /**
     * Rectangle for background.
     */
    public backgroundRectangle : Rectangle;

    /**
     * Constructs a new scene instance.
     * @param width Optional width of the scene
     * @param height Optional height of the scene
     * @param background Optional flag to determine if a background should be drawn
     */
    constructor(config: SceneConfig = {}) {

        let defaultConfig: SceneConfig = {
            root: document.querySelector('#root') as HTMLDivElement,
            width: 960,
            height: 540,
            responsive: true,
            background: true,
            suffix: null,
        };

        config = { ...defaultConfig, ...config };

        this.animations = [];
        this.active = false;
        this.currentAnimation = 0;
        this.currentAnimationFrame = 0;
        this._fps = 30;
        this.mode = SceneMode.Live;

        // If width and height are not provided, default to these values
        let effectiveWidth = config.width;
        let effectiveHeight = config.height;

        this.frame = new ResponsiveFrame(config.root, {
            width: effectiveWidth,
            height: effectiveHeight,
            responsive: config.responsive
        });

        this.frame.setAttribute('id', this.constructor.name + (config.suffix ? config.suffix : ''));

        if (config.background) {
            this.backgroundRectangle = this.frame.rectangle(0, 0, effectiveWidth, effectiveHeight);
            this.backgroundRectangle.style.fill = 'var(--background)';
            this.frame.root.prepend(this.backgroundRectangle.root);
        }

        this.onDoneCallback = () => {

        };

    }

    /**
     * Sets the mode for the scene.
     */
    setMode(mode: SceneMode): void {
        this.mode = mode;
    }

    /**
     * Returns the frames per second
     */
    get fps() : number {
        return this._fps;
    }

    /**
     * Sets the reset function
     */
    set reset(fn: () => void) {
        this._reset = fn;
    }

    /**
     * Resets the scene
     */
    get reset(): () => void {
        return this._reset;
    }

    /**
     * Sets the onDone callback function.
     */
    setOnDone(callback: () => void): void {
        this.onDoneCallback = callback;
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
    private requestFrame(callback: FrameRequestCallback, frameCallback: (isWait:boolean) => void, isWait:boolean) {
        if (this.mode === SceneMode.Live) {
            requestAnimationFrame(callback);
        } else {
            frameCallback(isWait);
            callback(this.currentAnimationFrame + 1000 / this._fps);
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
    private runAnimation(timestamp: number, previousTimestamp?: number, frameCallback?: (isWait: boolean) => void, doneCallback?: () => void) {
        const animation = this.animations[this.currentAnimation];
        const rateFunc = EASING_FUNCTIONS[animation.type || 'linear'];
        const isWait = animation.type === 'wait';

        if (!previousTimestamp) {
            previousTimestamp = timestamp;
        }

        const elapsed = this.mode === SceneMode.Live
            ? timestamp - previousTimestamp
            : 1000 / this._fps;

        this.currentAnimationFrame += elapsed;

        if (this.currentAnimationFrame <= animation.duration) {
            const alpha = rateFunc(this.currentAnimationFrame / animation.duration);
            animation.animation(alpha);
            this.requestFrame(ts => this.runAnimation(ts, timestamp, frameCallback, doneCallback), frameCallback, isWait)
        } else {
            animation.animation(1);
            this.currentAnimationFrame = 0;
            this.currentAnimation++;

            if (this.currentAnimation < this.animations.length) {
                this.requestFrame(ts => this.runAnimation(ts, timestamp, frameCallback, doneCallback), frameCallback, isWait)
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
    export(frameCallback: (isWait: boolean) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.animations.length === 0) {
                console.log("No animations to play.");
            } else if (this.active) {
                console.log("Animation already in progress.");
            } else {
                try {
                    this.currentAnimation = 0;
                    this.runAnimation(0, undefined, frameCallback, resolve);
                } catch (error) {
                    reject(error);
                }
            }
        });
    }

    /**
     * Begins playing all animations in the scene.
     */
    start(): void {
        if (this.animations.length === 0) {
            console.log("No animations to play.");
        } else if (this.active) {
            console.log("Animation already in progress.");
        } else {
            // this.runAnimation(0); d
            this.active = true;
            this.currentAnimation = 0;
            this.runAnimation(0, undefined, undefined, () => {
                this.onDoneCallback();
                this.active = false;
            });
        }
    }

    /**
     * Schedules a pause in the animation sequence for the specified duration (in seconds) before proceeding to the next animation. This is counted as an animation in the sequence of animations in the scene.
     */
    wait(duration: number = 1): void {
        this.animations.push({
            duration: duration * 1000,
            animation: (alpha: number) => { },
            type: 'wait'
        });
    }

    /**
     * Schedule a play animation for the provided duration in seconds.
     */
    play(animations: AnimationFunction[], duration: number = 1, type: AnimationType = 'easeInOut'): void {
        this.animations.push({
            duration: duration * 1000,
            animation: (alpha: number) => {
                animations.forEach(animation => animation(alpha));
            },
            type: type
        });
    }
}

