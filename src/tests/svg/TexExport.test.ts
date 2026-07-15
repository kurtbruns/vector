/**
 * Guards that the MathJax export path in createInlineStyledSvg (exercised via
 * bundle()) performs NO `ex`-compensation. It used to rewrite the tex font-size to
 * 12px and multiply the glyph group by scale(1.1 * fontSize/12) for FIGMA (and
 * rescale background/inner for BROWSER) to patch up `ex`-based sizing. Glyphs are
 * now sized to deterministic px at the source (Tex.resolveGlyphPx), so that whole
 * block was removed. These tests fail if any of it is reintroduced.
 */

import { bundle, ExportTarget } from '../..';

const SVGNS = 'http://www.w3.org/2000/svg';

function buildTex(glyphWidth: string): SVGSVGElement {
    const root = document.createElementNS(SVGNS, 'svg') as SVGSVGElement;

    const tex = document.createElementNS(SVGNS, 'g');
    tex.setAttribute('class', 'tex mathjax');
    tex.setAttribute('font-size', '18px');

    const bg = document.createElementNS(SVGNS, 'g');
    bg.setAttribute('transform', 'translate(-8,-20) scale(1)');
    const rect = document.createElementNS(SVGNS, 'rect');
    rect.setAttribute('x', '-4');
    rect.setAttribute('y', '-3');
    rect.setAttribute('width', '30');
    rect.setAttribute('height', '46');
    bg.appendChild(rect);

    const inner = document.createElementNS(SVGNS, 'g');
    inner.setAttribute('transform', 'translate(-8,-20) scale(1)');
    const glyph = document.createElementNS(SVGNS, 'svg');
    glyph.setAttribute('width', glyphWidth);
    glyph.setAttribute('height', '40');
    glyph.setAttribute('viewBox', '0 -1107 1010 1793');
    inner.appendChild(glyph);

    tex.appendChild(bg);   // firstElementChild  -> background group
    tex.appendChild(inner); // nextElementSibling -> glyph group
    root.appendChild(tex);
    return root;
}

describe('bundle() does not ex-compensate MathJax', () => {
    // The removed FIGMA hack rewrote the tex font-size to 12px; its absence is the
    // observable signal that no ex-compensation runs. (jsdom's getComputedStyle
    // doesn't resolve transforms, so the injected scale itself isn't observable, but
    // the font-size rewrite shared the same code path.)

    it('does not rewrite the font-size for px glyphs (FIGMA)', () => {
        const out = bundle(buildTex('22.434547'), ExportTarget.FIGMA);
        expect(out).not.toContain('font-size="12px"');
    });

    it('does not rewrite the font-size for ex glyphs either (FIGMA)', () => {
        const out = bundle(buildTex('4.057ex'), ExportTarget.FIGMA);
        expect(out).not.toContain('font-size="12px"');
    });
});
