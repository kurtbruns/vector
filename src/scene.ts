import { Frame, ResponsiveFrame } from '.'

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
 * Scene class to manage and control a series of animations.
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
     * The front-end displaying the current frame in the browser.
     */
    public frame: Frame;

    /**
     * Constructs a new scene. 
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
     * Set the scene mode
     */
    setMode(mode: SceneMode): void {
        this.mode = mode;
    }

    private requestFrame(callback: FrameRequestCallback, frameCallback?) {
        if (this.mode === SceneMode.Live) {
            requestAnimationFrame(callback);
        } else {
            // setTimeout(() => {
            //     let f = this.animations[this.currentAnimation].animation.toString();
            //     frameCallback( f !== 'alpha => {}')
            //     callback(this.currentAnimationFrame + 1000 / this.fps)
            // }, 1000 / this.fps)
            let f = this.animations[this.currentAnimation].animation.toString();
            frameCallback( f !== 'alpha => {}')
            callback(this.currentAnimationFrame + 1000 / this.fps)
        }
    }

    private runAnimation(timestamp: number, previousTimestamp?: number, frameCallback?, doneCallback?) {
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
     * Exports the animation sequence.
     * Returns a Promise that resolves when the entire animation sequence completes.
     */
    export(frameCallback: (boolean) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.runAnimation(0, undefined, frameCallback, resolve);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Start playing all of the animations in the scene.
     */
    start(): void {
        this.runAnimation(0);
    }

    /**
     * Schedule a wait animation for the provided duraction in seconds before the next animation.
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

