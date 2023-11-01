import { Frame } from '../index';
import { Layout } from './layout';

export interface Configuration {
  frame?:Frame;
  right?:boolean;
}

/**
* Renders an interactive "template" for creating responsive interactives. This
* generic template renders an interactive with a "header" and "footer" region
* for providing custom information and controls.
*/
export class SideBarLayout extends Layout {

  /**
  * The HTMLElement which the template is rendered within.
  */
  parent:HTMLElement;

  /**
  * The root of the template
  */
  root:HTMLDivElement;

  /**
  * The left side bar region of the template
  */
  sidebar:HTMLDivElement;

  /**
  * The main region of the template
  */
  main:HTMLDivElement;

  frame: Frame;

  /**
  * Default configuration for all templates.
  */
  static config = {
    right:false
  };

  /**
  * Constructs a template within the DOM element corresponding to the id. If
  * user configuration is provided, the user configuration is prioritized over
  * the default configuration stored in the Template.config variable.
  */
  constructor(parent:HTMLElement, config:Configuration = {} )  {

    super(document.createElement('div'));

    // combine the default configuration with the user's configuration
    config = { ...SideBarLayout.config, ...config };

    this.root.classList.add((config.right ? 'right-side-bar' : 'left-side-bar'));

    this.sidebar = document.createElement('div');
    this.main = document.createElement('div');

    this.sidebar.classList.add('side-bar-region');
    this.main.classList.add('main-region');

    this.container.append(this.root);
    this.root.append(this.main, this.sidebar);
  }
}