import { BaseNode } from './node';

/**
* A point has an x position and y position
*/
export class Point extends BaseNode {
    x:number;
    y:number;
    constructor( x:number, y:number) {
      super();
      this.x = x;
      this.y = y;
    }
}