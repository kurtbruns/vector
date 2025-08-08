import { flattenSVG } from "../util";
import { interpolateColor } from "../Color";
import { Group, Rectangle, SVG } from "./svg";
import { CoreAttributes, PresentationAttributes } from "./svg/base-element";
import { GroupAttributes } from "./svg/group";

type TexAttributes = 'font-size';

/**
 * TeX class represents a mathematical expression rendered as SVG using MathJax
 */
export class Tex extends Group {

    private _x: number;
    private _y: number;
    private _scale: number;
    private _backgroundColor: string;

    private inner: Group;
    private background: Group;
    private rendered: SVGSVGElement;

    /**
     * Constructor takes a string 's' representing the TeX to be rendered and optional 'x' and 'y' coordinates to position the SVG element
     */
    constructor(s: string, x: number, y: number) {

        super();

        if (typeof MathJax === 'undefined') {
            console.warn('MathJax is not defined. Please make sure MathJax is installed and properly loaded.');
        } else if (typeof MathJax.tex2svg !== 'function') {
            console.warn('MathJax.tex2svg is not available. Please ensure the tex2svg extension is included.');
        }

        let output = MathJax.tex2svg(s, {});
        this.rendered = output.firstChild as SVGSVGElement;

        flattenSVG(this.rendered);

        this.classList.add('tex', 'mathjax');
        this.setAttribute('color', 'var(--font-color)');
        this.root.setAttribute('font-size', '16px');

        this.background = this.group();
        this.inner = this.group();
        this.inner.root.appendChild(this.rendered);

        // this._scale = 20/18;
        this._scale = 1;
        this.inner.setAttribute('transform', `scale(${this._scale})`);

        this.moveTo(x, y)

    }

    /**
     * Moves t1 to t2
     */
    static moveTo (t1:Tex, t2:Tex) {

        let t1_bbox = t1.rendered.getBoundingClientRect();
        let t2_bbox = t2.rendered.getBoundingClientRect();

        // Calculate the center positions
        let t1_center_x = t1_bbox.x + t1_bbox.width / 2;
        let t1_center_y = t1_bbox.y + t1_bbox.height / 2;
        let t2_center_x = t2_bbox.x + t2_bbox.width / 2;
        let t2_center_y = t2_bbox.y + t2_bbox.height / 2;

        // Move t1 so its center aligns with t2's center
        t1.shift(t2_center_x - t1_center_x, t2_center_y - t1_center_y);

    }

    /**
     * Aligns t2 to t1
     */
    static alignBy(t1:Tex, t2:Tex, s1:string, s2?:string, occurrence: number = 0) {

        if(!s2) {
            s2 = s1;
        }

        let t_eq_tex = t1.getPartsByTex(s1, occurrence)[0].getBoundingClientRect();
        let r_teq_tex = t2.getPartsByTex(s2, occurrence)[0].getBoundingClientRect();

        let shiftX = t_eq_tex.x - r_teq_tex.x;
        let shiftY = t_eq_tex.y - r_teq_tex.y;

        t2.shift(shiftX, shiftY);
    }

    static alignVerticallyBy(t1:Tex, t2:Tex, s1:string, s2?:string, occurrence: number = 0) {

        if(!s2) {
            s2 = s1;
        }

        let t_eq_tex = t1.getPartsByTex(s1, occurrence)[0].getBoundingClientRect();
        let r_teq_tex = t2.getPartsByTex(s2, occurrence)[0].getBoundingClientRect();

        t2.shift(0, t_eq_tex.y - r_teq_tex.y);
    }

    static alignHorizontallyBy(t1:Tex, t2:Tex, s1:string, s2?:string, occurrence: number = 0) {

        if(!s2) {
            s2 = s1;
        }

        let t_eq_tex = t1.getPartsByTex(s1, occurrence)[0].getBoundingClientRect();
        let r_teq_tex = t2.getPartsByTex(s2, occurrence)[0].getBoundingClientRect();

        t2.shift(t_eq_tex.x - r_teq_tex.x, 0);
    }

    static setOpacityOfTex = (t:SVGElement[], value:number) => {

        console.warn('This method is deprecated. Please use this.animate.setOpacityOfParts instead.');

        let hasStarted = false;
        let startValue : number;    
        return (alpha : number) => {
            if (!hasStarted) {
                startValue = parseFloat(t[0].getAttribute('opacity'));
                if(isNaN(startValue)) {
                    startValue = 1;
                }
                hasStarted = true;
            }
            const opacity = startValue + (value - startValue)*alpha;
            for(let i = 0; i < t.length; i++) {
                t[i].setAttribute('opacity', opacity.toString());
            }
        };
    }

    static setOpacity = (t:SVGElement[], value:number) => {
        for(let i = 0; i < t.length; i++) {
            t[i].setAttribute('opacity', value.toString());
        }
    }

    setOpacityOfParts(tex: string, value:number) {
        let parts = this.getMatchesByTex(tex);
        if (parts && parts.length > 0) {
            for(let i = 0; i < parts.length; i++) {
                parts[i].forEach(node => {
                    (node as SVGSVGElement).setAttribute('opacity', value.toString());
                });
            }
        }
    }

    /**
     * Aligns this Tex object to another Tex object by matching specific text
     */
    alignTo(other: Tex, s: string, occurrence: number = 0): Tex {
        Tex.alignBy(other, this, s, s, occurrence);
        return this;
    }

    /**
     * Aligns this Tex object horizontally to another Tex object by matching specific text
     */
    alignHorizontallyTo(other: Tex, s: string, occurrence: number = 0): Tex {
        Tex.alignHorizontallyBy(other, this, s, s, occurrence);
        return this;
    }

    /**
     * Aligns this Tex object vertically to another Tex object by matching specific text
     */
    alignVerticallyTo(other: Tex, s: string, occurrence: number = 0): Tex {
        Tex.alignVerticallyBy(other, this, s, s, occurrence);
        return this;
    }

    // comment inherited from base class
    setAttribute(name: TexAttributes | GroupAttributes | CoreAttributes | PresentationAttributes, value: string): Group {
        this.root.setAttribute(name, value);
        return this;
    }

    setBackgroundOpacity(x:number) {
        this.background.setAttribute('opacity', x.toFixed(2));
    }

    replace(s:string, backgroundColor = this._backgroundColor) : Tex {

        let output = MathJax.tex2svg(s, {});
        let rendered = output.firstChild as SVGSVGElement;
        flattenSVG(rendered);
        rendered.classList.add('tex', 'mathjax');

        this.inner.root.removeChild(this.rendered);
        this.inner.root.appendChild(rendered);
        this.rendered = rendered;
        this.drawBackground(true, backgroundColor);
        return this;
    }

    private findSubtreeMatches(root: Element, subtree: Element): Element[][] {

        const matches: Element[][] = [];

        /**
         * Returns true if the subtree node is a deep match, meaning they have identical structure.
         */
        function nodeMatches(node: Element, subtreeNode: Element): boolean {
            if (node.tagName !== subtreeNode.tagName) {
                return false;
            }
            if (node.getAttribute('data-mml-node') !== subtreeNode.getAttribute('data-mml-node')) {
                return false;
            }
            if (node.hasAttribute('data-c') && node.getAttribute('data-c') !== subtreeNode.getAttribute('data-c')) {
                return false;
            }

            const nodeChildren = Array.from(node.children) as Element[];
            const subtreeChildren = Array.from(subtreeNode.children) as Element[];

            if (nodeChildren.length !== subtreeChildren.length) {
                return false;
            }

            for (let i = 0; i < nodeChildren.length; i++) {
                if (!nodeMatches(nodeChildren[i], subtreeChildren[i])) {
                    return false;
                }
            }

            return true;
        }

        /**
         * Traverses the tree looking for exact matching nodes and sequences of matching nodes
         */
        function traverse(node: Element) {
            Array.from(node.children).forEach((child, index, children) => {

                // Check if the child node is a deep match
                if (nodeMatches(child as Element, subtree)) {
                    matches.push([child as Element]);
                }

                // Check to see if there is a sequential match
                let currentChild: Element = child
                let currentNode: Element | null = subtree.firstChild as Element;
                let potentialMatch: Element[] = [];
                let lastMatch: Element | null = null;
                while (currentNode && currentChild && nodeMatches(currentChild as Element, currentNode)) {
                    potentialMatch.push(currentChild);
                    lastMatch = currentNode;
                    currentChild = currentChild.nextElementSibling as Element;
                    currentNode = currentNode.nextElementSibling as Element;
                }

                // If the sequence matched all of the subtrees nodes then its a match
                if (lastMatch === subtree.lastChild) {
                    matches.push(potentialMatch);
                }
            });

            Array.from(node.children).forEach(child => {
                traverse(child as Element);
            });
        }

        traverse(root);
        return matches;
    }

    setColorAll(tex: string, color: string) : Tex {
        this.getMatchesByTex(tex).forEach(matchedNodes => {
            matchedNodes.forEach(node => {
                (node as SVGSVGElement).style.fill = color;
            });
        });

        return this;
    }

    setColor(tex: string, color: string, index: number = 0): Tex {
        const matches = this.getMatchesByTex(tex);
    
        if( matches.length === 0 ) {
            throw new Error(`Found no match for: ${tex}`);
        }

        if (index < 0 || index >= matches.length) {
            throw new Error('Index is out of range');
        }
    
        matches[index].forEach(node => {
            (node as SVGSVGElement).style.fill = color;
        });
    
        return this;
    }
    

    // TODO: maybe get next match

    // TODO: ability to chain calls to getMatches

    getFirstMatch(tex: string): SVGElement[] | null {

        let output = MathJax.tex2svg(tex, {});
        let matchRendered = output.firstChild as SVGSVGElement;
        
        flattenSVG(matchRendered);

        let tree = this.rendered.querySelector('[data-mml-node="math"]');
        let match = matchRendered.querySelector('[data-mml-node="math"]');

        let matches = this.findSubtreeMatches(tree, match) as SVGElement[][];

        // TODO: some check?

        return matches[0];

    }

    /**
     * Returns one or more collections of elements that match the provided tex string's structure.
     */
    getMatchesByTex(tex: string): SVGElement[][] | null {

        let output = MathJax.tex2svg(tex, {});
        let matchRendered = output.firstChild as SVGSVGElement;
        
        flattenSVG(matchRendered);

        let tree = this.rendered.querySelector('[data-mml-node="math"]');
        let match = matchRendered.querySelector('[data-mml-node="math"]');

        return this.findSubtreeMatches(tree, match) as SVGSVGElement[][];

    }

    /**
     * Finds all SVG elements in the rendered document that correspond to a specific TeX string.
     * This method utilizes MathJax to render the TeX string to SVG and then queries the rendered output
     * for elements with specific data attributes that match the rendered TeX expression.
     *
     * @param str The TeX string to be matched in the rendered document.
     * @returns An array of SVG elements corresponding to the TeX string, or null if none are found.
     */
    getPartsByTex(str: string, occurrence: number = 0): SVGElement[] | null {

        // Render the sub-expression
        let output = MathJax.tex2svg(str, {});
        let rendered = output.firstChild as SVGSVGElement;

        // console.log(TreeNode.convertTreeToDOT(TreeNode.buildTree(flattenSVG(this.rendered))));

        // Extract data-c attributes
        const dataCAttributes = Array.from(rendered.querySelectorAll('[data-c]'))
            .map(el => el.getAttribute('data-c'));

        // If there are no data-c elements return null
        if (dataCAttributes.length === 0) {
            return null;
        }

        const mainContentSelectors = dataCAttributes.map(dc => `[data-c="${dc}"]`);
        const mainContentElements = mainContentSelectors.flatMap(selector =>
            Array.from(this.rendered.querySelectorAll(selector) as NodeListOf<SVGElement>)
        );

        // Group elements by occurrence
        const matches = this.getMatchesByTex(str);
        if (matches && matches.length > occurrence) {
            return matches[occurrence];
        }

        // Fallback to old behavior if no matches found
        return mainContentElements;
    }

    scale(s: number) {
        this._scale = s;
        this.inner.setAttribute('transform', `scale(${this._scale})`);
        return this;
    }

    alignCenter(): Tex {
        let bbox = this.rendered.getBoundingClientRect();
        this.inner.setAttribute('transform', `translate(${-bbox.width / 2}, ${-bbox.height / 2}) scale(${this._scale})`);
        this.background.setAttribute('transform', `translate(${-bbox.width / 2}, ${-bbox.height / 2}) scale(${this._scale})`);
        return this;
    }

    removeBackground() {
        this.background.setAttribute('opacity', '0');
    }

    drawBackground(replace:boolean = false, backgroundColor = 'var(--background)', increaseSize:number = 0) {
        let top = 3 + increaseSize;
        let bottom = 3 + increaseSize;
        let left = 4 + increaseSize;
        let right = 4 + increaseSize;
        let groupBbox = this.rendered.getBoundingClientRect();
        let rectangle = new Rectangle(
            0,
            0,
            groupBbox.width / this._scale + left + right,
            groupBbox.height / this._scale + top + bottom
        );
        rectangle.setAttribute('fill', backgroundColor);
        
        if(replace) {
            // TODO: should check that its a rect
            this.background.root.firstChild.remove()
            rectangle.setAttribute('fill', backgroundColor);
        }
        
        this.background.root.prepend(rectangle.root);

        // TODO: this seems weird
        this._backgroundColor = backgroundColor;

        let rectbbox = rectangle.root.getBoundingClientRect();
        rectangle.x += groupBbox.x - rectbbox.x - left;
        rectangle.y += groupBbox.y - rectbbox.y - right;

        return rectangle;
    }

    shift(point: { x: number, y: number }): Tex;

    shift(x: number, y: number): Tex;

    shift(x: any, y?: any): Tex {
        let pointX, pointY;
        if (typeof x === 'object') {
            pointX = x.x;
            pointY = x.y;
        } else {
            pointX = x;
            pointY = y;
        }
        this.moveTo(this._x + pointX, this._y + pointY);

        return this;
    }

    /**
    * Moves to a point provided as an object.
    * @param point An object that represents the point to move to.
    * @returns The instance of the class for chaining.
    */
    moveTo(point: { x: number, y: number }): Tex;

    /**
    * Moves to a point provided as two separate numbers.
    * @param x The x value of the point to move to.
    * @param y The y value of the point to move to.
    * @returns The instance of the class for chaining.
    */
    moveTo(x: number, y: number): Tex;

    moveTo(x: any, y?: any): Tex {
        let pointX, pointY;
        if (typeof x === 'object') {
            pointX = x.x;
            pointY = x.y;
        } else {
            pointX = x;
            pointY = y;
        }

        this._x = pointX;
        this._y = pointY;

        this.setAttribute(
            'transform',
            `translate(${this._x}, ${this._y})`
        );
        return this;
    }

    get animate() {

        return {
            setOpacity: (value:number) => {
                let hasStarted = false;
                let startValue : number;    
                return (alpha : number) => {
                    if (!hasStarted) {
                        startValue = parseFloat(this.getAttribute('opacity'));
                        if(isNaN(startValue)) {
                            startValue = 1;
                        }
                        hasStarted = true;
                    }
                    const opacity = startValue + (value - startValue)*alpha;
                    this.setAttribute('opacity', opacity.toString()) 
                };
            },
            setOpacityOfParts: (tex: string, value:number) => {
                let parts = this.getFirstMatch(tex);
                let hasStarted = false;
                let startValue : number;    
                return (alpha : number) => {
                    if (!hasStarted) {
                        if (parts && parts.length > 0) {
                            startValue = parseFloat(parts[0].getAttribute('opacity'));
                            if(isNaN(startValue)) {
                                startValue = 1;
                            }
                        } else {
                            startValue = 1;
                        }
                        hasStarted = true;
                    }
                    const opacity = startValue + (value - startValue)*alpha;
                    if (parts) {
                        for(let i = 0; i < parts.length; i++) {
                            parts[i].setAttribute('opacity', opacity.toString());
                        }
                    }
                };
            },
            alignParts: (other: Tex, s: string, occurrence: number = 0) => {
                let t_eq_tex = this.getPartsByTex(s, occurrence)[0].getBoundingClientRect();
                let r_teq_tex = other.getPartsByTex(s, occurrence)[0].getBoundingClientRect();
        
                let shiftX = t_eq_tex.x - r_teq_tex.x;
                let shiftY = t_eq_tex.y - r_teq_tex.y;
                
                let hasStarted = false;
                let startX : number;
                let startY : number;

                return (alpha : number ) => {
                    if (!hasStarted) {
                        startX = this._x;
                        startY = this._y;
                        
                        hasStarted = true;
                    }

                    this.moveTo(startX - shiftX * alpha, startY - shiftY * alpha);
                    this.updateDependents();
                };
            },
            moveTo: (x: number, y: number) => {
                let hasStarted = false;
                let startX : number;
                let startY : number;

                return (alpha : number ) => {
                    if (!hasStarted) {
                        startX = this._x;
                        startY = this._y;
                        hasStarted = true;
                    }

                    this.moveTo(startX + (x - startX) * alpha, startY + (y - startY) * alpha);
                    this.updateDependents();
                };
            },
            shift: (x: number, y: number) => {
                let hasStarted = false;
                let startX: number;
                let startY: number;

                return (alpha: number) => {
                    if (!hasStarted) {
                        startX = this._x;
                        startY = this._y;
                        hasStarted = true;
                    }

                    const newX = startX + x * alpha;
                    const newY = startY + y * alpha;

                    this.moveTo(newX, newY);
                    this.updateDependents();
                }
            },
            setColorAll: (tex: string, color: string) => {
                let hasStarted = false;
                let matchedNodes: SVGElement[][] = [];
                let startColors: string[] = [];

                return (alpha: number) => {
                    if (!hasStarted) {
                        matchedNodes = this.getMatchesByTex(tex) || [];
                        // Store the current color of each matched element
                        startColors = [];
                        matchedNodes.forEach(matchedNode => {
                            matchedNode.forEach(node => {
                                const currentColor = (node as SVGSVGElement).style.fill || 'var(--font-color)';
                                startColors.push(currentColor);
                            });
                        });
                        hasStarted = true;
                    }

                    let colorIndex = 0;
                    matchedNodes.forEach(matchedNode => {
                        matchedNode.forEach(node => {
                            // Interpolate from the stored start color to target color
                            const startColor = startColors[colorIndex];
                            const interpolatedColor = interpolateColor(startColor, color, alpha);
                            (node as SVGSVGElement).style.fill = interpolatedColor;
                            colorIndex++;
                        });
                    });
                };
            },
        };
    }
}



class TreeNode {
    parent: TreeNode | null;
    children: TreeNode[];
    element: Element | Document;

    constructor(element: Element | Document, parent: TreeNode | null = null) {
        this.element = element;
        this.parent = parent;
        this.children = [];
    }

    static buildTree(node: Element | Document, parent: TreeNode | null = null): TreeNode {
        let treeNode = new TreeNode(node, parent);

        if (node instanceof Element) {
            for (let child of Array.from(node.children)) {
                treeNode.children.push(this.buildTree(child, treeNode));
            }
        }

        return treeNode;
    }

    static convertTreeToDOT(tree: TreeNode): string {
        let dotString: string = "digraph DOMTree {\n";
        let nodeIndex: number = 0;
        let nodeLabels: Map<TreeNode, string> = new Map();

        function getLabel(node: TreeNode): string {
            if (!nodeLabels.has(node)) {
                let mml = (node.element as HTMLElement).getAttribute('data-mml-node');
                let c = (node.element as HTMLElement).getAttribute('data-c');

                let label = `${node.element.nodeName}-${mml === null ? 'c-' + c : 'node-' + mml}-${nodeIndex++}`;
                nodeLabels.set(node, label);
            }
            return nodeLabels.get(node);
        }

        function traverseTree(node: TreeNode): void {
            let nodeLabel = getLabel(node);
            if (node.parent) {
                let parentLabel = getLabel(node.parent);
                dotString += `  "${parentLabel}" -> "${nodeLabel}"\n`;
            }

            node.children.forEach(child => traverseTree(child));
        }

        traverseTree(tree);
        dotString += "}";

        return dotString;
    }


}