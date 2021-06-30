import './assets/styles/normalize.css';
import './assets/styles/reset.css';

import { Plot } from './modules/plot/plot-grid-based';
import { File } from './index';

let root = document.getElementById('root');
root.style.maxWidth = `${720}px`;

let count = 0;
function createContainer() {
  let container = document.createElement('div');
  container.id = `container-${count++}`;
  container.style.marginBottom = '1.5rem';
  root.appendChild(container);
  return container;
}

let plot = new Plot(createContainer(), {
  width: 600,
  height: 600,
  internalX: 0,
  internalY: -20,
  internalHeight: 20,
  internalWidth: 20,
  responsive: true  
});

let s= 10;
plot.addFunction((x) => s*Math.sin(x/s)).style.stroke = '#58c4dd'
plot.addFunction((x) => s*x/s*x/s).style.stroke = '#83c167'
plot.addFunction((x) => s*(Math.sin(x/s) + x/s*x/s)).style.stroke = '#fff933'
plot.draw();

plot.gridGroup.style.stroke = '#ffffff';
plot.drawBackground('#000000');
 
(window as any).download = () => {
  File.download(plot.id, `${plot.id}.svg`, 'assets/main.css');
}
