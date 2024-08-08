import { BaseNode } from './BaseNode';

/**
* A value
*/
export class StringValue extends BaseNode {

    private _s:string;

    constructor(s: string = '') {
        super();
        this._s = s;
    }
    
    public get value() : string {
        return this._s; 
    }

    public set value(s: string)  {
        this._s = s;
    }
    
}