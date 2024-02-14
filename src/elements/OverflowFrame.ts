import { Group } from "./svg/group";
import { Frame, FrameConfig } from "./Frame";

/**
 * A responsive SVG document that is optimized to prevent cumulative layout shift in the browser 
 * and draw SVG documents within a horizontally constrained vertical layout.
 */
export class OverflowFrame extends Frame {

	private _grid : Group;
	private _lines1 : Group;
	private _lines2 : Group;
	private _lines3 : Group;
		
	static lightStroke = 'var(--grid-tertiary)';
	static mediumStroke = 'var(--grid-secondary)';
	static darkStroke = 'var(--grid-primary)';

	/**
	 * Constructs a responsive SVG Document that is optimized to prevent cumulative layout shift in 
	 * the browser. The width and height measurements are used to define 1) the aspect ratio of the 
	 * rendered SVG and 2) the internal coordinate system used for drawing. The maxWidth argument 
	 * optionally specifies the maximum display width of the SVG, otherwise the default is to fill 
	 * the availablespace.
	 */
	constructor( container:HTMLElement, config:FrameConfig ) {

		let defaultConfig = {
			origin: 'default'
		};

		config = { ...defaultConfig, ...config};

		// Construct a SVG with the provided dimensionsc combinding default config with custom
		super(container, config);

		// Fill available space
		this.style.display = 'block';
		this.style.maxWidth = '100%';
		this.style.height = 'auto';
		this.style.overflow = 'visible';
		
		(this.container as HTMLElement).style.overflow = 'hidden';

		switch(config.align) {
			case 'center':
				this.root.style.margin = 'auto';
				break;
			case 'right':
					this.root.style.marginLeft = 'auto';
					break;
			case 'left':
					this.root.style.marginRight = 'auto';
					break;
			default:
					throw new Error(`Unknown alignment option: ${config.align}.`);
		}

		// Define the origin used for drawing
		switch(config.origin) {
			case 'center':
				this.setViewBox(-this.width/2, -this.height/2, this.width, this.height);
				break;
			case 'centerY':
				this.setViewBox(0, -this.height/2, this.width, this.height);
				break;
			case 'default':
				this.setViewBox(0, 0, this.width, this.height);
				break;
			default:
				throw new Error(`Unrecognized origin: ${origin}. Please provide a valid orign`);
		}
	}

	drawGrid2( x:number, y:number, width:number, height:number, border:boolean, origin:boolean) {

		if( !this._grid ) {
			
			this._grid = this.background.group();
			this._lines1 = this._grid.group();
			this._lines2 = this._grid.group();
			this._lines3 = this._grid.group();

			this._lines1.style.stroke = OverflowFrame.lightStroke;
			this._lines2.style.stroke = OverflowFrame.mediumStroke;
			this._lines3.style.stroke = OverflowFrame.darkStroke;

			let xMax = x + width;
			let yMax = y + height;

			if( origin ) {
					let origin = this._grid.circle(0,0,3);
					origin.style.fill = 'var(--green)';
					origin.style.stroke = '#485bfc';
					origin.style.strokeWidth = '1px';
			}

			for( let i = Math.floor(x/10)*10; i <= xMax; i += 10) {
			
				let group;
				if( i % 100 === 0) {
					group = this._lines3;
				} else if ( i % 50 === 0) {
					group = this._lines2;
				} else {
					group = this._lines1;;
				}
				group.line(i, y, i, yMax);
			}
			for( let i = Math.floor(y/10)*10; i <= yMax; i += 10) {
			
				let group;
				if( i % 100 === 0) {
						group = this._lines3;
				} else if ( i % 50 === 0) {
					group = this._lines2;
				} else {
					group = this._lines1;;
				}
					group.line(x, i, xMax, i);
			}
			
			if( border ) {
					let rect = this.rect(0,0,this.width, this.height);
					rect.style.strokeWidth = '1px';
					rect.style.stroke = 'blue';
					rect.style.fill = 'none';
			}
		} 
	}

	/**
	 * This helper method draws a grid to visualize the coordinate system used for drawing SVG 
	 * ELements.
	 */
	drawGrid( border:boolean = false, origin:boolean = false ) {
		let viewBox = this.root.viewBox.baseVal;
		let x = viewBox.x;
		let y = viewBox.y;
		let width = 720;
		let height = viewBox.height;
		this.drawGrid2(x, y, width, height, border, origin);
	}
}