/**
 * Regression tests for the background rectangle drawn behind a Tex label.
 *
 * The glyph is sized deterministically from the MathJax viewBox (resolveGlyphPx),
 * and drawBackground() places the rectangle from those known dimensions at
 * (-left, -top) with size (glyph + padding). The MathJax stub here has no viewBox,
 * so the glyph resolves to 0×0 and the rectangle is exactly the padding — which
 * makes the offset math deterministic in jsdom. This pins the specific bug this
 * suite guards against: the vertical offset once used `right` (4) instead of `top`
 * (3), biasing every label's background upward — invisibly on single glyphs,
 * visibly on tall fractions.
 */

import { Tex } from '../..';

// Minimal MathJax stub: tex2svg only needs to hand back an object whose
// firstChild is an <svg> element for the Tex constructor + flattenSVG.
function installMathJaxStub() {
    (globalThis as any).MathJax = {
        tex2svg: (_s: string) => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('data-mml-node', 'math');
            svg.appendChild(g);
            return { firstChild: svg };
        },
    };
}

// jsdom does not implement SVGRectElement.x/y/width/height as SVGAnimatedLength,
// which Rectangle's getters/setters rely on. Back each by the underlying
// attribute so drawBackground() can run and its geometry can be measured.
function polyfillSvgRectLengths() {
    // Resolve whatever prototype jsdom actually uses for a <rect> element.
    const sample = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const proto = Object.getPrototypeOf(sample);
    if (!proto) return;
    for (const name of ['x', 'y', 'width', 'height']) {
        Object.defineProperty(proto, name, {
            configurable: true,
            get(this: SVGElement) {
                const el = this;
                return {
                    baseVal: {
                        get value() {
                            return parseFloat(el.getAttribute(name) || '0') || 0;
                        },
                        set value(v: number) {
                            el.setAttribute(name, String(v));
                        },
                    },
                };
            },
        });
    }
}

beforeEach(() => {
    installMathJaxStub();
    polyfillSvgRectLengths();
    document.body.innerHTML = '';
});

afterEach(() => {
    delete (globalThis as any).MathJax;
});

describe('Tex.drawBackground padding offsets', () => {
    const LEFT = 4;
    const TOP = 3;

    it('offsets the background rectangle by left/top, not left/right', () => {
        const tex = new Tex('x', 0, 0);
        document.body.appendChild(tex.root);

        const rect = tex.drawBackground();

        // In a zero-layout environment the offset collapses to (-left, -top).
        expect(rect.x).toBeCloseTo(-LEFT, 5);
        // The bug asserted here: y must use `top` (3). Regression value was -4.
        expect(rect.y).toBeCloseTo(-TOP, 5);
    });

    it('sizes the rectangle by left+right and top+bottom padding', () => {
        const tex = new Tex('x', 0, 0);
        document.body.appendChild(tex.root);

        const rect = tex.drawBackground();

        // glyph box is 0x0 in jsdom, so the rect is exactly the padding.
        expect(rect.width).toBeCloseTo(LEFT * 2, 5);
        expect(rect.height).toBeCloseTo(TOP * 2, 5);
    });

    it('applies increaseSize symmetrically to all four sides', () => {
        const tex = new Tex('x', 0, 0);
        document.body.appendChild(tex.root);

        const grow = 5;
        const rect = tex.drawBackground(false, 'var(--background)', grow);

        expect(rect.x).toBeCloseTo(-(LEFT + grow), 5);
        expect(rect.y).toBeCloseTo(-(TOP + grow), 5);
        expect(rect.width).toBeCloseTo((LEFT + grow) * 2, 5);
        expect(rect.height).toBeCloseTo((TOP + grow) * 2, 5);
    });
});
