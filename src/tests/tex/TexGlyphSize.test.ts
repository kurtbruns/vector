/**
 * Tests for deterministic, font-independent glyph sizing (Tex.resolveGlyphPx).
 *
 * The glyph <svg>'s px size is derived from the MathJax viewBox and font-size —
 * `px = viewBoxDim * fontSize * C` (C = 1/1000, since MathJax uses 1000 viewBox
 * units per em) — with no dependency on the live DOM, the page font, or webfont
 * load timing. That makes it fully checkable in jsdom via a stubbed MathJax.
 */

import { Tex } from '../..';

const SVGNS = 'http://www.w3.org/2000/svg';
const C = 1 / 1000;
// Must track DEFAULT_TEX_FONT_SIZE in Tex.ts.
const FONT_SIZE = 22;

// The viewBox the MathJax stub reports; mutable so replace() can be exercised.
let stubViewBox = '0 -1107 1010 1793';

function installMathJaxStub() {
    (globalThis as any).MathJax = {
        tex2svg: (_s: string) => {
            const svg = document.createElementNS(SVGNS, 'svg');
            svg.setAttribute('viewBox', stubViewBox);
            // MathJax emits ex-based dimensions; resolveGlyphPx should replace them.
            svg.setAttribute('width', '2.285ex');
            svg.setAttribute('height', '4.057ex');
            const g = document.createElementNS(SVGNS, 'g');
            g.setAttribute('data-mml-node', 'math');
            svg.appendChild(g);
            return { firstChild: svg };
        },
    };
}

// jsdom doesn't implement SVGRectElement.x/y/width/height as SVGAnimatedLength,
// which Rectangle relies on. Back each by the underlying attribute.
function polyfillSvgRectLengths() {
    const proto = Object.getPrototypeOf(document.createElementNS(SVGNS, 'rect'));
    if (!proto) return;
    for (const name of ['x', 'y', 'width', 'height']) {
        Object.defineProperty(proto, name, {
            configurable: true,
            get(this: SVGElement) {
                const el = this;
                return {
                    baseVal: {
                        get value() { return parseFloat(el.getAttribute(name) || '0') || 0; },
                        set value(v: number) { el.setAttribute(name, String(v)); },
                    },
                };
            },
        });
    }
}

beforeEach(() => {
    stubViewBox = '0 -1107 1010 1793';
    installMathJaxStub();
    polyfillSvgRectLengths();
    document.body.innerHTML = '';
});

afterEach(() => {
    delete (globalThis as any).MathJax;
});

describe('Tex deterministic glyph sizing', () => {
    it('resolves the glyph <svg> to px from viewBox * fontSize * C, dropping ex units', () => {
        const tex = new Tex('\\frac{\\pi}{4}', 0, 0);
        document.body.appendChild(tex.root);

        const svg = tex.root.querySelector('svg') as SVGElement;
        const w = svg.getAttribute('width') as string;
        const h = svg.getAttribute('height') as string;

        expect(parseFloat(w)).toBeCloseTo(1010 * FONT_SIZE * C, 5);
        expect(parseFloat(h)).toBeCloseTo(1793 * FONT_SIZE * C, 5);
        expect(w.endsWith('ex')).toBe(false);
        expect(h.endsWith('ex')).toBe(false);
    });

    it('sizes the background to the resolved glyph plus symmetric padding', () => {
        const tex = new Tex('\\frac{\\pi}{4}', 0, 0);
        document.body.appendChild(tex.root);

        const rect = tex.drawBackground();

        expect(rect.width).toBeCloseTo(1010 * FONT_SIZE * C + 8, 5);
        expect(rect.height).toBeCloseTo(1793 * FONT_SIZE * C + 6, 5);
        expect(rect.x).toBeCloseTo(-4, 5);
        expect(rect.y).toBeCloseTo(-3, 5);
    });

    it('re-resolves the glyph size when replace() swaps the expression', () => {
        const tex = new Tex('\\frac{\\pi}{4}', 0, 0);
        document.body.appendChild(tex.root);
        tex.drawBackground();

        stubViewBox = '0 -1000 2000 1000';
        tex.replace('x');

        const svg = tex.root.querySelector('svg') as SVGElement;
        expect(parseFloat(svg.getAttribute('width') as string)).toBeCloseTo(2000 * FONT_SIZE * C, 5);
        expect(parseFloat(svg.getAttribute('height') as string)).toBeCloseTo(1000 * FONT_SIZE * C, 5);
    });
});
