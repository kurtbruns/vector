import { flattenSVG } from "../util";
import { interpolateColor } from "../Color";
import { Group, Rectangle } from "./svg";
import { CoreAttributes, PresentationAttributes } from "./svg/base-element";
import { GroupAttributes } from "./svg/group";

type TexAttributes = 'font-size';

/**
 * Pixels per MathJax viewBox unit, per unit of font-size. MathJax's tex-svg output
 * uses 1000 viewBox units = 1em, so 1/1000 resolves the glyph at its natural em size
 * (1em = fontSize px) — font-independent, matching how KaTeX / the figma-mathtex-editor
 * plugin render at a given size. This is the single calibration constant for label
 * sizing; see resolveGlyphPx().
 */
const TEX_GLYPH_PX_PER_UNIT_EM = 1 / 1000;

/**
 * Default font-size (px) applied to a Tex label when none is specified. Chosen so
 * font-size-natural sizing lands on roughly the previous on-page label size: the old
 * `ex`-relative sizing at 18px matched the page font (Inter) x-height, ~1/0.811
 * larger than natural, so 18 / 0.811 ≈ 22.
 */
const DEFAULT_TEX_FONT_SIZE = 22;

/**
 * TeX class represents a mathematical expression rendered as SVG using MathJax
 */
export class Tex extends Group {

    private _x: number;
    private _y: number;
    private _scale: number;
    private _backgroundColor: string;

    // Glyph size resolved deterministically from the MathJax viewBox and font-size
    // (see resolveGlyphPx). Used to size and center the background without measuring
    // the live DOM, so it is stable regardless of which font is loaded or when.
    private _glyphWidth: number = 0;
    private _glyphHeight: number = 0;

    // Whether alignCenter() was requested, so replace() can re-center on the new size.
    private _centered: boolean = false;

    // The live background rectangle and the padding it was drawn with, so a font-size
    // change can resize it in place rather than rebuild it (which would drop the
    // caller's fill — Frame.tex() paints 'transparent' for background-less labels).
    private _backgroundRect: Rectangle;
    private _backgroundIncrease: number = 0;

    private inner: Group;
    private background: Group;
    private rendered: SVGSVGElement;

    /**
     * MathJax must already be loaded as a global. The warnings below are advisory only.
     * If MathJax is missing, the tex2svg call right after them still throws.
     *
     * Renders synchronously at DEFAULT_TEX_FONT_SIZE and draws no background. Call
     * drawBackground() to add one.
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
        this.root.setAttribute('font-size', `${DEFAULT_TEX_FONT_SIZE}px`);

        this.background = this.group();
        this.inner = this.group();
        this.inner.root.appendChild(this.rendered);

        // Resolve the MathJax `ex`-based dimensions to deterministic px up front so
        // the glyph renders at a stable, font-independent size everywhere.
        this.resolveGlyphPx();

        this._scale = 1;
        this.inner.setAttribute('transform', `scale(${this._scale})`);

        this.moveTo(x, y)

    }

    /**
     * Shifts t1 so its rendered center lines up with t2's. Measures both with
     * getBoundingClientRect, so both labels must already be laid out in the document.
     * The result is meaningless for a detached or unrendered frame.
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
     * Shifts t2 so its `s2` part lands on t1's `s1` part, leaving t1 where it is. `s2`
     * defaults to `s1`. Measures the live DOM, as static moveTo does.
     *
     * @throws TypeError if either expression has no matching part. getPartsByTex
     * returns null in that case, and this indexes `[0]` into it.
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

    /**
     * @deprecated Use `tex.animate.setOpacityOfParts` instead. Warns at runtime.
     */
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

    /**
     * Setting `font-size` re-resolves the glyph size and resizes the background in
     * place. Every other attribute passes through to the base implementation.
     */
    setAttribute(name: TexAttributes | GroupAttributes | CoreAttributes | PresentationAttributes, value: string): Group {
        this.root.setAttribute(name, value);

        // The glyph's px size is derived from font-size (resolveGlyphPx), which only
        // runs at construction and on replace(). Without re-resolving here, setting
        // font-size after construction would silently do nothing.
        if (name === 'font-size') {
            this.resolveGlyphPx();
            this.resizeBackground();
            if (this._centered) {
                this.applyCenter();
            }
        }

        return this;
    }

    setBackgroundOpacity(x:number) {
        this.background.setAttribute('opacity', x.toFixed(2));
    }

    /**
     * Swaps in a new expression, preserving the current background color, scale, and
     * centering. Detaches the old glyph nodes, so any element references previously
     * handed out by getMatchesByTex / getPartsByTex / getFirstMatch go stale.
     */
    replace(s:string, backgroundColor = this._backgroundColor) : Tex {

        let output = MathJax.tex2svg(s, {});
        let rendered = output.firstChild as SVGSVGElement;
        flattenSVG(rendered);
        rendered.classList.add('tex', 'mathjax');

        this.inner.root.removeChild(this.rendered);
        this.inner.root.appendChild(rendered);
        this.rendered = rendered;
        this.resolveGlyphPx();
        this.drawBackground(true, backgroundColor);
        if (this._centered) {
            this.applyCenter();
        }
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
            Array.from(node.children).forEach((child) => {

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

    /**
     * Fills every structural match of `tex`. Does nothing when `tex` does not occur.
     * Compare setColor, which throws on a missing match.
     */
    setColorAll(tex: string, color: string) : Tex {
        this.getMatchesByTex(tex).forEach(matchedNodes => {
            matchedNodes.forEach(node => {
                (node as SVGSVGElement).style.fill = color;
            });
        });

        return this;
    }

    /**
     * Fills the `index`-th structural match of `tex`.
     *
     * @throws if `tex` does not occur in this label, or `index` is out of range. Use
     * setColorAll when a missing match should be tolerated.
     */
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

    /**
     * Returns the first structural match for `tex`, or undefined when the expression
     * does not occur in this label. That is undefined rather than an empty array, so
     * callers must guard before indexing.
     */
    getFirstMatch(tex: string): SVGElement[] | undefined {

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
     * Returns every structural match for `tex`. Yields an empty array when nothing
     * matches, never null, so the result is always safe to iterate.
     */
    getMatchesByTex(tex: string): SVGElement[][] {

        let output = MathJax.tex2svg(tex, {});
        let matchRendered = output.firstChild as SVGSVGElement;
        
        flattenSVG(matchRendered);

        let tree = this.rendered.querySelector('[data-mml-node="math"]');
        let match = matchRendered.querySelector('[data-mml-node="math"]');

        return this.findSubtreeMatches(tree, match) as SVGSVGElement[][];

    }

    /**
     * Finds the elements corresponding to `str`. Looks for an exact structural match at
     * `occurrence` first, and falls back to matching on glyph (`data-c`) identity.
     *
     * Returns null when `str` renders to no glyphs at all. The align helpers index
     * `[0]` into this result without guarding, so a null shows up there as a TypeError
     * rather than a quiet no-op.
     */
    getPartsByTex(str: string, occurrence: number = 0): SVGElement[] | null {

        // Render the sub-expression
        let output = MathJax.tex2svg(str, {});
        let rendered = output.firstChild as SVGSVGElement;

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

    /**
     * Sets the glyph scale. Overwrites the inner transform outright, so calling this
     * after alignCenter() drops the centering translate. Call alignCenter() again
     * afterwards to put it back.
     */
    scale(s: number) {
        this._scale = s;
        this.inner.setAttribute('transform', `scale(${this._scale})`);
        return this;
    }

    /**
     * Centers the glyph on its origin and keeps it centered across later replace()
     * and font-size changes.
     */
    alignCenter(): Tex {
        this._centered = true;
        this.applyCenter();
        return this;
    }

    private applyCenter(): void {
        const tx = -(this._glyphWidth * this._scale) / 2;
        const ty = -(this._glyphHeight * this._scale) / 2;
        this.inner.setAttribute('transform', `translate(${tx}, ${ty}) scale(${this._scale})`);
        this.background.setAttribute('transform', `translate(${tx}, ${ty}) scale(${this._scale})`);
    }

    /**
     * Resolves the MathJax `<svg>`'s `ex`-based dimensions to deterministic px in the
     * figure's user space, computed from its `viewBox` and the label's font-size:
     * `px = viewBoxDimension * fontSize * TEX_GLYPH_PX_PER_UNIT_EM`. This is
     * font-independent (no reliance on the page font's x-height or on when a webfont
     * loads) and synchronous, so the glyph renders at the same natural size in the
     * browser and in headless rasterizers (resvg), and its px `width`/`height` let the
     * export path treat it as already-resolved. Called once at construction and again
     * whenever `replace()` swaps in a new expression.
     */
    private resolveGlyphPx(): void {
        const viewBox = (this.rendered.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
        const fontSize = parseFloat(this.root.getAttribute('font-size')) || DEFAULT_TEX_FONT_SIZE;
        const vbWidth = viewBox.length === 4 ? viewBox[2] : 0;
        const vbHeight = viewBox.length === 4 ? viewBox[3] : 0;
        this._glyphWidth = vbWidth * fontSize * TEX_GLYPH_PX_PER_UNIT_EM;
        this._glyphHeight = vbHeight * fontSize * TEX_GLYPH_PX_PER_UNIT_EM;
        if (this._glyphWidth > 0 && this._glyphHeight > 0) {
            // Unitless px in the parent user space (replaces MathJax's `ex` units).
            this.rendered.setAttribute('width', `${this._glyphWidth}`);
            this.rendered.setAttribute('height', `${this._glyphHeight}`);
        }
    }

    /**
     * Resizes the existing background rectangle to the current glyph dimensions,
     * keeping the padding and fill it was drawn with. Mutates in place rather than
     * rebuilding, so a caller's fill override (notably the 'transparent' that
     * Frame.tex() applies for background-less labels) survives a resize.
     */
    private resizeBackground(): void {
        if (!this._backgroundRect) {
            return;
        }
        const vertical = 3 + this._backgroundIncrease;
        const horizontal = 4 + this._backgroundIncrease;
        this._backgroundRect.width = this._glyphWidth + horizontal * 2;
        this._backgroundRect.height = this._glyphHeight + vertical * 2;
        this._backgroundRect.x = -horizontal;
        this._backgroundRect.y = -vertical;
    }

    /**
     * Hides the background by zeroing its opacity. The rectangle stays in the DOM, so
     * drawBackground(replace) still finds it and resizeBackground still tracks it.
     */
    removeBackground() {
        this.background.setAttribute('opacity', '0');
    }

    /**
     * Draws a background rectangle sized to the resolved glyph box plus padding, and
     * records it so a later font-size change can resize it in place.
     *
     * @param replace drops the existing background first. Throws if none was drawn.
     */
    drawBackground(replace:boolean = false, backgroundColor = 'var(--background)', increaseSize:number = 0) {
        let top = 3 + increaseSize;
        let bottom = 3 + increaseSize;
        let left = 4 + increaseSize;
        let right = 4 + increaseSize;

        // The glyph occupies [0, 0, _glyphWidth, _glyphHeight] in the inner group's
        // user space (resolveGlyphPx). Size the rectangle from those known dimensions
        // and offset it by the symmetric padding, so the background is concentric with
        // the glyph by construction — no live measurement, no font-load dependency.
        let rectangle = new Rectangle(
            0,
            0,
            this._glyphWidth + left + right,
            this._glyphHeight + top + bottom
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
        this._backgroundRect = rectangle;
        this._backgroundIncrease = increaseSize;

        rectangle.x = -left;
        rectangle.y = -top;

        return rectangle;
    }

    /**
     * Moves the label by a delta from its current position. See moveTo for absolute
     * positioning.
     */
    shift(point: { x: number, y: number }): Tex;

    shift(x: number, y: number): Tex;

    shift(x: number | { x: number, y: number }, y?: number): Tex {
        let pointX: number, pointY: number;
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
     * Moves the label to an absolute position in the parent's user space. See shift
     * for relative movement.
     */
    moveTo(point: { x: number, y: number }): Tex;

    moveTo(x: number, y: number): Tex;

    moveTo(x: number | { x: number, y: number }, y?: number): Tex {
        let pointX: number, pointY: number;
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

    /**
     * Animation factories for Scene. Each returns a callback taking alpha in [0, 1].
     * The callback captures its start state the first time it runs, so it cannot be
     * replayed from a new starting value. Build a fresh one for each animation.
     */
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
