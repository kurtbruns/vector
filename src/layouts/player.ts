import { Scrubber } from '../elements/input/Scrubber'
import { Frame } from '../index';
import { Layout } from './Layout';

export interface Configuration {
  width?: number;
  min?: number;
  max?: number;
  value?: number;
  loop?: boolean;
}

/**
* Renders a "playable" interactive within the HTML element with the provided ID.
* A playable interactive contains a
*/
export class PlayerLayout extends Layout {

  root: HTMLDivElement;

  main: HTMLDivElement;
  canvas: HTMLDivElement;
  controls: HTMLDivElement;
  footer: HTMLDivElement;

  // playButton:HTMLDivElement;
  // sliderContainer:HTMLDivElement;
  // slider:HTMLInputElement;

  scrubberInteractive: Frame;
  scrubber: Scrubber;

  min: number;
  max: number;
  value: number;
  loop: boolean;

  constructor(element: HTMLElement, options: Configuration = {}) {

    super(element)

    let defaultOptions: Configuration = {
      width: 600
    }

    // combine the default configuration with the user's configuration
    let config = { ...defaultOptions, ...options };

    // get a handle on the parent and resize if necessary
    let bbox = this.container.getBoundingClientRect();
    let width = config.width > bbox.width ? bbox.width : config.width;
    if (width < 288) {
      width = 288;
    }

    this.root = document.createElement('div');
    this.main = document.createElement('div');
    this.canvas = document.createElement('div');
    this.controls = document.createElement('div');
    this.footer = document.createElement('div');

    this.root.classList.add('animation-root');
    this.main.classList.add('animation-main');
    this.canvas.classList.add('animation-canvas');
    this.controls.classList.add('animation-controls');
    this.footer.classList.add('animation-footer');

    // append children
    this.container.appendChild(this.root);
    this.root.appendChild(this.main);
    this.root.appendChild(this.footer);
    this.main.appendChild(this.canvas);
    this.main.appendChild(this.controls);

    this.root.style.width = `${width}px`;

    this.scrubberInteractive = new Frame(this.controls, {
      width: width,
      height: 50,
      origin: 'default',
      responsive: false
    });

    this.scrubber = this.scrubberInteractive.scrubber(25, 25, {
      min: config.min,
      max: config.max,
      value: config.value,
      width: width - 50,
      loop: config.loop
    });

    // this.addDependency(this.scrubber);
  }
}