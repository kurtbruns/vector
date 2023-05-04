import { TAU } from "../../util/math";
import { Plot } from "./plot";

/**
 * An extension of the plot object that specializes in drawing a tau scaled coordinate system
 */
export class TrigPlot extends Plot {
	constructor( e, f, c = {}) {

		let defaultConfig = {
			// width: 432,
      // height: 216,
      width: 720 - 96,
			height: 144*2,
      // width: 720,
      // height: 144*3  - 96,
      
			internalX:0,
			internalY:-1,
			internalWidth: TAU,
			internalHeight: 2,
	 
			responsive:true
		}

		c = {...defaultConfig, ...c};

		super(e, f, c)

		this.draw()
		this.drawCustomGrid()
		// this.drawBorder()

	}

	drawCustomGrid() {
		
		let bbox = this.root.getBoundingClientRect();
		let p1 = this.screenToSVG(bbox.x, bbox.y);
		let p2 = this.screenToSVG(bbox.width + bbox.x, bbox.height + bbox.y);
		
		let group3 = this.gridGroup.group();
		group3.style.stroke = '#f8f8f8'
		
		let group2 = this.gridGroup.group();
		group2.style.stroke = '#eeeeee'

		let group1 = this.gridGroup.group();
		group1.style.stroke = '#e0e0e0'
		// group1.style.stroke = '#f0f0f0'

		// group2.style.stroke = '#dddddd'

    let n = 100;
    let step1 = 10;
    let step2 = 5;
		for( let i = 0; i <= n; i ++ ) {
			// let x = (i/10);
			let x = p1.x + (i/n)*TAU;
			if( i % step1 === 0) {
				group1.line(x, p1.y, x, p2.y);
			} else if( i % step2 === 0 ) {
				group2.line(x, p1.y, x, p2.y);
			} else {
				group3.line(x, p1.y, x, p2.y);
			}
		}

		let startY = Math.ceil(p1.y*10);
		let endY = Math.ceil(p2.y*10);
		for( let i = startY; i < endY; i++) {
			let y = i/10;
			if( i % 10 === 0 ) {
				group1.line(p1.x, y, p2.x, y);
			} else if( i % 5 === 0) {
				group2.line(p1.x, y, p2.x, y);
			} else {
				group3.line(p1.x, y, p2.x, y);
			}
		}
  }
  
  drawCustomGrid2() {
		
		let bbox = this.root.getBoundingClientRect();
		let p1 = this.screenToSVG(bbox.x, bbox.y);
		let p2 = this.screenToSVG(bbox.width + bbox.x, bbox.height + bbox.y);
		
		let group3 = this.gridGroup.group();
		group3.style.stroke = '#f8f8f8'
		
		let group2 = this.gridGroup.group();
		group2.style.stroke = '#eeeeee'

		let group1 = this.gridGroup.group();
		group1.style.stroke = '#e0e0e0'
		// group1.style.stroke = '#f0f0f0'

		// group2.style.stroke = '#dddddd'

    let n = 180;
    let step = 15;
    let step2 = 5;
    // let n = 360;
    // let step = 30;
    // let step2 = 10;
		for( let i = 0; i <= n; i ++ ) {
			// let x = (i/10);
			let x = (i/n)*TAU;
			if( i % step === 0) {
				group1.line(x, p1.y, x, p2.y);
			} else if( i % step2 === 0 ) {
				group2.line(x, p1.y, x, p2.y);
			} else {
				group3.line(x, p1.y, x, p2.y);
			}
		}

		let startY = Math.ceil(p1.y*10);
		let endY = Math.ceil(p2.y*10);
		for( let i = startY; i < endY; i++) {
			let y = i/10;
			if( i % 10 === 0 ) {
				group1.line(p1.x, y, p2.x, y);
			} else if( i % 5 === 0) {
				group2.line(p1.x, y, p2.x, y);
			} else {
				group3.line(p1.x, y, p2.x, y);
			}
		}
  }
  
  drawCustomGrid3() {
		
		let bbox = this.root.getBoundingClientRect();
		let p1 = this.screenToSVG(bbox.x, bbox.y);
		let p2 = this.screenToSVG(bbox.width + bbox.x, bbox.height + bbox.y);
		
		let group3 = this.gridGroup.group();
		group3.style.stroke = '#f8f8f8'
		
		let group2 = this.gridGroup.group();
		group2.style.stroke = '#eeeeee'

		let group1 = this.gridGroup.group();
		group1.style.stroke = '#e0e0e0'
		// group1.style.stroke = '#f0f0f0'

		// group2.style.stroke = '#dddddd'

    let n = 100;
    let step1 = 10;
    let step2 = 5;
		for( let i = -40; i <= n; i ++ ) {
			// let x = (i/10);
			let x = (i/10);
			if( i % step1 === 0) {
				group1.line(x, p1.y, x, p2.y);
			} else if( i % step2 === 0 ) {
				group2.line(x, p1.y, x, p2.y);
			} else {
				group3.line(x, p1.y, x, p2.y);
			}
		}

		let startY = Math.ceil(p1.y*100);
		let endY = Math.ceil(p2.y*100);
		for( let i = startY; i < endY; i++) {
			let y = i/100*TAU;
			if( i % 10 === 0 ) {
				group1.line(p1.x, y, p2.x, y);
			} else if( i % 5 === 0) {
				group2.line(p1.x, y, p2.x, y);
			} else {
				group3.line(p1.x, y, p2.x, y);
			}
		}
  }


}
