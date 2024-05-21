import { DependencyGraph } from './DependencyGraph'
import { BaseNode } from './BaseNode';

/**
* This controller manages the dependencies between elements.
*/
export class Controller {

    /**
    * Contains the dependencies between elements
    */
    dependencyGraph: DependencyGraph<BaseNode>;

    /**
    * Constructs a controller
    */
    constructor() {
        this.dependencyGraph = new DependencyGraph<BaseNode>();
    }

    /**
    * Clears all the elements from this controller.
    */
    clear() {
        this.dependencyGraph = new DependencyGraph<BaseNode>(); // TODO: implement clear method
    }

    /**
    * Adds an element to this controller.
    */
    add(element: BaseNode) {
        this.dependencyGraph.add(element);
    }

    /**
    * Removes an element from this controller.
    */
    remove(element: BaseNode) {
        this.dependencyGraph.remove(element);
    }

    /**
    * Updates this element and all of its dependents
    */
    update(element: BaseNode) {
        let deps = this.dependencyGraph.getDependents(element);
        for (let d of deps) {
            if( d.update !== undefined ) {
                d.update();
            }
        }
    }
}
