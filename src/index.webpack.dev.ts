import './assets/styles/vector.css';
import './assets/styles/dark.css';
import './template.scss';

import { PlotGridBased } from './modules/plot/plot-grid-based';
import { Artboard, File } from './index';

const root = document.querySelector('#root')

// root.style.maxWidth = `${720}px`;

let count = 0;
function createContainer() {
  let container = document.createElement('div');
  container.id = `container-${count++}`;
  container.style.marginBottom = '1.5rem';
  root.appendChild(container);
  return container;
}

let plot = new PlotGridBased(createContainer(), {
  width: 500,
  height: 300,
  internalX: 0,
  internalY: -30,
  internalWidth: 10,
  internalHeight: 30,
  responsive: true  
});

// function upsideDownParabola(x) {
//   const a = 15 / 16;
//   const h = 4;
//   const k = 15;

//   return -a * Math.pow(x - h, 2) + k;
// }

// function parabolaDerivative(x) {
//   const a = 15 / 16;

//   return -2 * a * (x - 4);
// }

// function parabolaIntegral(T) {
//   const a = 15 / 48;
//   const h = 4;

//   return (-a * Math.pow(T - h, 3) + 15 * T) - (-a * Math.pow(0 - h, 3) + 15 * 0);
// }

function fn(t) {
  return (8 - t)*t;
}

function integral(T) {
  return 4 * Math.pow(T, 2) - (1 / 3) * Math.pow(T, 3);
}


let s = 10;
// let p = plot.addFunction((x) => x).style.stroke = '#404040';
// plot.addFunction((x) => s*(Math.pow(x/s, 3) - 1));
plot.addFunction(fn).style.stroke = 'var(--blue)';
// plot.addFunction(integral).style.stroke = 'var(--green)'
// plot.addFunction(parabolaDerivative)
// plot.addFunction(parabolaIntegral)
plot.draw();
plot.drawBackground('var(--background)');

// let s= 10;
// plot.addFunction((x) => s*Math.sin(x/s)).style.stroke = '#58c4dd'
// plot.addFunction((x) => s*x/s*x/s).style.stroke = '#83c167'
// plot.addFunction((x) => s*(Math.sin(x/s) + x/s*x/s)).style.stroke = '#fff933'
// plot.draw();

// plot.gridGroup.style.stroke = '#ffffff';
// plot.drawBackground('#000000');
 
(window as any).download = () => {
  File.download(plot.id, `${plot.id}.svg`);
}
