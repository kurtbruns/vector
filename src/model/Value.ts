import { BaseNode } from './BaseNode';

/**
* A value
*/
export class Value extends BaseNode {

    private v:number;

    constructor(v: number = 0) {
        super();
        this.v = v;
    }

    get animate() {
        // The context for `this` is stored to be used in the returned function below
        const context = this;

        // Return an object with the `setValue` method
        return {
            setValue: function(end: number) {
                let hasStarted = false;
                let start;

                return (alpha: number) => {
                    if (!hasStarted) {
                        start = context.v;
                        hasStarted = true;
                    }

                    const diff = end - start;
                    context.v = start + diff * alpha;
                    context.updateDependents();
                };
            }
        };
    }
    
    public get value() : number {
        return this.v; 
    }

    public set value(v: number)  {
        this.v = v;
    }
    
}