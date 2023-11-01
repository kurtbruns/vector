import { BaseNode } from './node';

/**
* A value
*/
export class Value extends BaseNode {

    private v:number;

    constructor(v: number) {
        super();
        this.v = v;
    }

    // animate(animation: Animation, easing: RateFunction = 'linear'): Animation {
    //     // TODO:
    //     return;
    // }

    public setValue(target:number) : (number) => void {
        return (alpha:number) => {
            this.value = alpha*target;
            this.updateDependents()
        }
    }
    
    public get value() : number {
        return this.v; 
    }

    public set value(v: number)  {
        this.v = v;
    }
    
}