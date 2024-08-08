import { Controller } from './Controller'

/**
* A basic element of the interactive ecosystem. Each element has an unique
* identifier, an update function to be defined by the user, and the ability to
* add dependencies on other elements.
*/
export abstract class BaseNode {

    /**
    * The controller manages the dependencies between elements. Every element
    * is added to this controller upon creation.
    */
    static controller: Controller = new Controller();

    /**
    * The update function describes how this element should update itself
    */
    update: () => void;

    /**
    * Constructs the elements and adds it into the current controller.
    */
    constructor() {

        // initialize update function
        this.update = undefined;

    }

    // animate() : (alpha: number) => void {

    // }

    /**
    * Clears the static data structures holding elements and resets the count.
    */
    static clear() {
        BaseNode.controller.clear();
    }

    /**
    * Removes this element from the dependency graph.
    */
    reset() {
        BaseNode.controller.remove(this);
        BaseNode.controller.add(this);
    }

    /**
    * Removes this element from the dependency graph.
    */
    remove() {
        BaseNode.controller.remove(this);
    }

    /**
    * Declares this element dependent on the provided element(s).
    */
    addDependency(...elements: BaseNode[]) {
        for (let element of elements) {
            BaseNode.controller.dependencyGraph.addDependency(element, this);
        }
    }

    /**
    * Removes this element as being dependent on the provided element(s).
    */
    removeDependency(...elements: BaseNode[]) {
        for (let element of elements) {
            BaseNode.controller.dependencyGraph.removeDependency(element, this);
        }
    }

    /**
    * Updates all of the elements that depend on this element.
    */
    updateDependents() {
        BaseNode.controller.update(this);
    }
}
