import './assets/styles/normalize.css';
import './assets/styles/reset.css';

import { Plot } from './modules/plot/plot-grid-based';
import { File, GridArtboard } from './index';

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

// let plot = new Plot(createContainer(), {
//   width: 1000,
//   height: 200,
//   internalX: -50,
//   internalY: -50,
//   internalHeight: 20,
//   internalWidth: 100,
//   responsive: true  
// });

// Data
const events = [
  ["First Math Class", "1827-01-01", 1827.00000],
  ["First Rejection", "1828-08-01", 1828.58197],
  ["Early Publications", "1829-04-01", 1829.24658],
  ["Father's Suicide", "1829-07-02", 1829.49863],
  ["Second Rejection", "1829-08-01", 1829.58082],
  ["Entered École Normale", "1829-11-01", 1829.83288],
  ["Grand Prix Submission", "1830-02-27", 1830.15616],
  ["July Revolution", "1830-07-29", 1830.57260],
  ["Expulsion", "1831-01-04", 1831.00822],
  ["First Memoir", "1831-01-17", 1831.04384],
  ["Libri's Lecture", "1831-04-18", 1831.29315],
  ["Banquet", "1831-05-10", 1831.35342],
  ["Trial", "1831-06-15", 1831.45205],
  ["Referee Meeting", "1831-07-04", 1831.50411],
  ["Bastille Day", "1831-07-14", 1831.53151],
  ["Convicted and Sentenced", "1831-10-23", 1831.80822],
  ["Preface", "1831-12-01", 1831.91507],
  ["Countryside", "1832-03-16", 1832.20492],
  ["Duel", "1832-05-30", 1832.40984],
];

// Helper function to create SVG elements
function createSVGElement(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const attr in attrs) {
    el.setAttribute(attr, attrs[attr]);
  }
  return el;
}

// Create an SVG element and set its dimensions
const svg = createSVGElement("svg", { width: "70000", height: "20000" });

// Create a group element for text labels
const textGroup = createSVGElement("g", {});

const rect = createSVGElement("rect", {
  x: 0,
  y: 0,
  width : "70000",
  height: "20000",
  fill: 'none',
  stroke: '#EEEEEE'
})
svg.appendChild(rect);

// Loop through events and create circles and text labels for each event
events.forEach(([name, date, decimalDate], index) => {
  const xPos = (decimalDate as any - 1827) * 10000 + 10000;
  const yPos = 10000 + (index % 2 === 0 ? -500 : 500); // Alternate y-positions for better readability

  const circle = createSVGElement("circle", {
    cx: xPos,
    cy: yPos,
    r: "80",
    fill: "#333333",
    style: "stroke:#AAAAAA; stroke-width:12px",
  });

  const text = createSVGElement("text", {
    x: xPos + 10,
    y: yPos + 5,
    "font-size": "360",
    "style": 'fill:#EEEEEE'
  });
  text.textContent = name;

  // Add the circle and text to the SVG element
  svg.appendChild(circle);
  textGroup.appendChild(text);
});

// Add the text group to the SVG element
svg.appendChild(textGroup);

// Add the SVG element to the DOM
document.body.appendChild(svg);


// let s = 10;
// // let p = plot.addFunction((x) => x).style.stroke = '#404040';
// plot.addFunction((x) => s*(Math.pow(x/s, 3) - 1)/(x/s -1));
// plot.draw();

// // let s= 10;
// // plot.addFunction((x) => s*Math.sin(x/s)).style.stroke = '#58c4dd'
// // plot.addFunction((x) => s*x/s*x/s).style.stroke = '#83c167'
// // plot.addFunction((x) => s*(Math.sin(x/s) + x/s*x/s)).style.stroke = '#fff933'
// // plot.draw();

// // plot.gridGroup.style.stroke = '#ffffff';
// // plot.drawBackground('#000000');
 
// (window as any).download = () => {
//   File.download(plot.id, `${plot.id}.svg`, 'assets/main.css');
// }
