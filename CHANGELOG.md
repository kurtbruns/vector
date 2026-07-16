# Changelog

All notable changes to `@kurtbruns/vector` are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.3] - 2026-07-16
### Fixed
- `Tex.setAttribute('font-size', ...)` resizes the label again. Before 0.11.0, sizing came from
  MathJax's `ex` units, which scale with font-size, so setting font-size after construction worked.
  0.11.0 resolved the glyph to px once in the constructor, which left later font-size changes writing
  the attribute but never resizing anything. Setting font-size now re-resolves the glyph, resizes the
  background, and re-centers when `alignCenter()` is in effect.
  **Upgrade note:** labels that set font-size after construction have been rendering at the default
  22px. They will now render at the size they ask for, so re-inspect those labels after upgrading.
### Changed
- `getMatchesByTex()` no longer declares `| null`. It returns `[]` when nothing matches, and never
  returned null. `getFirstMatch()` declares `| undefined` rather than `| null`, which is what it
  actually returns for no match. Both are type-only corrections; runtime behavior is unchanged.

## [0.11.2] - 2026-07-16
### Fixed
- Exported SVGs now bake the computed `color`. `Tex` sets `color: var(--font-color)`, and a CSS custom
  property cannot resolve in an export — an SVG referenced by `<img>` is isolated from the page's CSS —
  so any `currentColor` paint fell back to black instead of the theme's color.
- `ILLUSTRATOR` / `FIGMA` exports no longer carry the `vector-<hash>` scoping class. The hash derives
  from the build clock (`Theme.id`), so an unchanged drawing serialized to different bytes on every
  export, churning diffs for consumers who commit their SVGs. The class scopes nothing in a standalone
  export — the styles it contributed are already inlined by that point.

## [0.11.1] - 2026-07-15
### Changed
- `Frame.tex()` / `Plot.tex()` now set a `data-tex` attribute on the rendered group instead of `id`.
  The old `id` held the raw TeX string, producing invalid ids (backslashes, spaces, braces) that were
  unusable as selectors.
- `flattenSVG()` strips the leftover MathJax glyph `id`s from inlined `<use>` clones, eliminating
  duplicate/invalid ids and dead markup in exported SVGs. Semantic hooks (`data-mml-node`, `data-c`)
  are preserved.

## [0.11.0] - 2026-07-15
### Changed
- MathJax labels are now sized font-size-natural — resolved to deterministic px at the source
  (`viewBox * fontSize / 1000`) instead of page-font-relative `ex` units. Labels render at the same
  size in the browser and in headless rasterizers, and label backgrounds are concentric by
  construction. Default Tex font-size bumped 18 → 22 so existing labels keep their prior on-page size.
  **Upgrade note:** re-inspect label positions and sizes after upgrading.
### Fixed
- Resolved npm audit vulnerabilities via non-breaking dependency updates.

## [0.10.1] - 2026-04-15
### Fixed
- Axis arrowheads no longer collide with the perpendicular axis when a plot range ends exactly at the
  origin; arrows now render only at endpoints pointing into open space.

## [0.10.0] - 2026-04-15
### Added
- `CoordinateSystem3D.drawCone()` / `drawConeArrow()` with view-aware base/outline rendering.
### Changed
- `CoordinateSystem3D`: `cameraPosition.z` convention flipped so positive z faces the scene
  (warns on negative z).
- `CoordinateSystem3D`: 3D axis label colors swapped (x = red, y = green).
- `CoordinateSystem3D`: half-angle trackball rotation via `pow(0.5)`.
### Removed
- Dead `skipButtonPlaceHolder` in `Player`.

## [0.9.5] - 2026-03-12
### Added
- `CoordinateSystem3D.copyCameraButton()` — copies camera orientation/position as a code snippet.
### Changed
- Publish only `dist/` (`files` field); trimmed published package contents.

## [0.9.4] - 2026-03-10
### Fixed
- Packaging: self-relative imports in `Image.ts`, corrected repository URL, lockfile hygiene.

---
Releases 0.9.3 and earlier predate this changelog — see the git tags and commit history
(`git -C src/vector log`).
