import { Input } from "../elements/input/Input";
import { Slider } from "../elements/input/Slider";
import { BaseElement, BaseNode, Frame } from "../index";

interface Configuration {
  frame?:Frame;
}

/**
 * A generic layout for arranging frame's in space
 */
export class Layout { 

  frame:Frame;

  /**
   * The parent of the layout
   */
  container:HTMLElement;

  static inputCount : number = 0;

  constructor(element: HTMLElement, config: Configuration = {}) {
    this.container = element;
  }
  
  addRegion() : HTMLDivElement {
    let region = document.createElement('div');
    region.classList.add('region');
    return this.container.appendChild(region);
  }

  // addCustomVariableDisplay( region, variable, valueFunction) {
  //   let container = document.createElement('div');
  //   container.classList.add('display-box');
  //   region.appendChild(container);

  //   let bbox = region.getBoundingClientRect();
  //   let interactive = new Frame(container, {
  //     width: 200,
  //     height: 50,
  //     responsive: false
  //   });

  //   // interactive.root.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  //   // interactive.root.setAttribute('width', '100%');

  //   let text = interactive.text( 16, 25, '');
  //   text.classList.add('katex-main');
  //   text.style.dominantBaseline = 'middle';
  //   text.tspan(variable).classList.add('katex-variable');
  //   text.tspan(' = ');
  //   let value = text.tspan( valueFunction() );
  //   text.addDependency(this);
  //   text.update = () => {
  //     value.text = valueFunction();
  //   };
  //   return container;
  // }

  addContainer( region:HTMLDivElement ) : HTMLDivElement {
    let container = document.createElement('div');
    container.classList.add('display-box');
    return region.appendChild(container);
  }
  
  /**
   *
   */
  addButton( region:HTMLDivElement, name:string) : HTMLButtonElement {

    let button = document.createElement('button');
    button.classList.add('muted-button');
    button.innerText = name;

    region.appendChild(button);

    return button;
  }

  /**
   *
   */
  addCheckbox( region:HTMLDivElement, value:boolean, name:string) : HTMLInputElement {

    let container = document.createElement('div');
    container.classList.add('display-box');
    container.style.padding = '0.5rem';
    container.style.display = 'flex';

    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox'
    checkbox.checked = value;
    checkbox.id = `input-${Layout.inputCount++}`;

    let label = document.createElement('label');
    label.setAttribute('for', checkbox.id);
    label.innerText = name;
    label.style.paddingLeft = '0.5rem';

    region.appendChild(container);
    container.appendChild(checkbox);
    container.appendChild(label);

    return checkbox;
  }

  /**
   *
   */
  addSlider( region:HTMLDivElement, min:number, max:number, value:number, label:string) : HTMLInputElement {

    let container = document.createElement('div');
    container.classList.add('display-box');
    container.style.padding = '0.5rem';

    let slider = document.createElement('input');
    slider.type = 'range'
    slider.min = min.toFixed();
    slider.max = max.toFixed();
    slider.value = value.toFixed();

    slider.setAttribute('aria-label', label);

    return region
    .appendChild(container)
    .appendChild(slider);
  }

  // 	/**
  //  *
  //  */
  // static addSlider( region:HTMLDivElement, min:number, max:number, value:number) : Slider {

  // 	let container = document.createElement('div');
  // 	container.classList.add('display-box');

  // 	// get a handle on the parent and resize if necessary
  // 	let bbox = region.getBoundingClientRect();
  // 	let interactive = new Interactive(container, {
  // 		height:20,
  // 		width: bbox.width - 30
  // 	});
  // 	interactive.root.style.overflow = 'visible';

  // 	let slider = interactive.slider(10, 10, {
  // 		min:min,
  // 		max:max,
  // 		value:value,
  // 		width: bbox.width - 50
  // 	});
  // 	// interactive.root.style.border = '1px solid #808080';
  // 	interactive.root.style.borderRadius = '5px';
  // 	interactive.root.style.padding = '10px';

  // 	region.appendChild(container);

  // 	return slider;
  // }

  addVariableDisplay( region:HTMLDivElement, variable:string, control:Input, accuracy:number = 0) : HTMLDivElement {

    let container = document.createElement('div');
    container.classList.add('display-box');
    region.appendChild(container);

    let bbox = region.getBoundingClientRect();
    let interactive = new Frame(container, {
      width: 200,
      height: 50,
      responsive: false
    });


    if( control instanceof Slider ) {
      let text = interactive.text( 16, 25, '');
      text.classList.add('katex-main');
      text.style.dominantBaseline = 'middle';
      text.tspan(variable).classList.add('katex-variable');
      text.tspan(' = ');
      let value = text.tspan(control.value.toFixed(accuracy));
      text.addDependency(control);
      text.update = () => {
        value.text = control.value.toFixed(accuracy);
      };
    } else {
      throw new Error('Not Implemented');
    }

    return container;
  }
  

}
