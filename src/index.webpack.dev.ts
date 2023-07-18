import './assets/styles/vector.css';
import './assets/styles/dark.css';
import './template.scss';

import { PlotGridBased } from './modules/plot/plot-grid-based';
import { Artboard, File, version} from './index';
import { Point } from './model/point';

const root = document.querySelector('#root') as HTMLDivElement;

console.log(version)

// root.style.maxWidth = `${300}px`;
// root.style.margin = `${(720-300)/2}px`;

let count = 0;
function createContainer() {
  let container = document.createElement('div');
  container.id = `container-${count++}`;
  container.style.marginBottom = '1.5rem';
  root.appendChild(container);
  return container;
}

let plot = new PlotGridBased(createContainer(), {
  width: 300,
  height: 300,
  internalX: -150,
  internalY: -150,
  internalWidth: 300,
  internalHeight: 300,
  responsive: true
});

let radius = 100;
let circle = plot.circle(0, 0, radius);
circle.style.stroke = '#f0f0f0';
circle.classList.add('non-scaling-stroke');

let control1 = plot.control(radius * Math.cos(1 * 2 * Math.PI / 3), -radius * Math.sin(1 * 2 * Math.PI / 3));
control1.constrainToCircle(0, 0, radius);

let control2 = plot.control(radius * Math.cos(2 * 2 * Math.PI / 3), -radius * Math.sin(2 * 2 * Math.PI / 3));
control2.constrainToCircle(0, 0, radius);

let control3 = plot.control(radius * Math.cos(3 * 2 * Math.PI / 3), -radius * Math.sin(3 * 2 * Math.PI / 3));
control3.constrainToCircle(0, 0, radius);

function addLineBetweenTwoPoints(line, c1, c2) {

  line.addDependency(c1, c2);
  line.update = () => {
    line.x1 = c1.x;
    line.y1 = c1.y;
    line.x2 = c2.x;
    line.y2 = c2.y;
  }
}

let origin = new Point(0, 0);

addLineBetweenTwoPoints(plot.line(control1.x, control1.y, origin.x, origin.y), control1, origin);
addLineBetweenTwoPoints(plot.line(control2.x, control2.y, origin.x, origin.y), control2, origin);

addLineBetweenTwoPoints(plot.line(control2.x, control2.y, control3.x, control3.y), control2, control3);
addLineBetweenTwoPoints(plot.line(control3.x, control3.y, control1.x, control1.y), control3, control1);


/**
* Normalizes the angle to be within the range [0, 2 PI].
*/
function normalize(angle) {
  if (angle > 0) {
    return angle;
  }
  else {
    return 2 * Math.PI + angle;
  }
}

// let path = plot.path('');
// path.root.style.fill = '#404040';
// path.style.stroke = 'var(--main)';
// path.update = function () {
//   let a1 = Math.atan2(control1.y - origin.y, control1.x - origin.x);
//   let a2 = Math.atan2(control2.y - origin.y, control2.x - origin.x);
//   let angle = normalize(a2 - a1);
//   let largeArcFlag = (angle > Math.PI) ? false : true;
//   let r = circle.r / 3;
//   let x1 = r * Math.cos(a1) + origin.x;
//   let y1 = r * Math.sin(a1) + origin.y;
//   let x2 = r * Math.cos(a2) + origin.x;
//   let y2 = r * Math.sin(a2) + origin.y;
//   path.d = `M ${origin.x} ${origin.y}
//         L ${control1.x} ${control1.y}
//         L ${x1} ${y1}
//         A ${r} ${r} 0 ${+largeArcFlag} 0 ${x2} ${y2}
//         L ${control2.x} ${control2.y}
//         z`;
// };
// path.update();
// path.addDependency(control1, control2, origin);


function addDisplayAngle(path, c0, c1, c2) {
  path.root.style.fill = '#404040';
  path.style.stroke = 'var(--main)';
  path.update = function () {
    let a1 = Math.atan2(c1.y - c0.y, c1.x - c0.x);
    let a2 = Math.atan2(c2.y - c0.y, c2.x - c0.x);
    let angle = normalize(a2 - a1);
    console.log(angle)

    let arcFlag = false;
    let sweepFlag = (angle > Math.PI) ? false : true;
    let r = circle.r / 4;
    let x1 = r * Math.cos(a1) + c0.x;
    let y1 = r * Math.sin(a1) + c0.y;
    let x2 = r * Math.cos(a2) + c0.x;
    let y2 = r * Math.sin(a2) + c0.y;
    path.d = `M ${c0.x} ${c0.y}
        L ${c1.x} ${c1.y}
        L ${x1} ${y1}
        A ${r} ${r} 0 ${+arcFlag} ${+sweepFlag} ${x2} ${y2}
        L ${c2.x} ${c2.y}
        z`;
  };
  path.update();
  path.addDependency(c0, c1, c2);
}

addDisplayAngle(plot.path(''), control3, control1, control2);


function addDisplayAngle2(path, c0, c1, c2, c3) {
  path.root.style.fill = '#404040';
  path.style.stroke = 'var(--main)';
  path.update = function () {
    let a1 = normalize(Math.atan2(c1.y - c0.y, c1.x - c0.x));
    let a2 = normalize(Math.atan2(c2.y - c0.y, c2.x - c0.x));
    let a3 = normalize(Math.atan2(c3.y - c0.y, c3.x - c0.x));
    let angle = normalize(Math.atan2(c1.y*c2.x - c1.x*c2.y, c1.x*c2.x + c1.y*c2.y));

    let arcFlag = (angle > Math.PI) ? true : false;
    let sweepFlag = (angle > Math.PI) ? true : true;

    if ((a1 < a3 && a3 < a2) || (a2 < a3) && (a3 < a1 )) {
      arcFlag = !arcFlag;
      sweepFlag = !sweepFlag;
    }

    let r = circle.r / 4;
    let x1 = r * Math.cos(a1) + c0.x;
    let y1 = r * Math.sin(a1) + c0.y;
    let x2 = r * Math.cos(a2) + c0.x;
    let y2 = r * Math.sin(a2) + c0.y;
    path.d = `M ${c0.x} ${c0.y}
        L ${c2.x} ${c2.y}
        L ${x2} ${y2}
        A ${r} ${r} 0 ${+arcFlag} ${+sweepFlag} ${x1} ${y1}
        L ${c1.x} ${c1.y}
        z`;

  };
  path.update();
  path.addDependency(c0, c1, c2, c3);
}

addDisplayAngle2(plot.path(''), origin, control1, control2, control3);


(window as any).download = () => {
  File.download(plot.id, `${plot.id}.svg`);
}
