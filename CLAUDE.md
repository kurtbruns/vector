# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vector is a TypeScript library for creating interactive math/vector graphics in the browser. It renders SVG (not Canvas) and integrates MathJax for LaTeX. Published as `@kurtbruns/vector` on npm.

## Commands

```bash
yarn build              # Webpack UMD bundle + tsc compilation
yarn test               # Run all Jest tests
yarn test -- path/to/test.ts  # Run a single test file
yarn test:update        # Update Jest snapshots
yarn watch              # tsc watch mode
yarn lint               # ESLint check
yarn lint:fix           # ESLint auto-fix
yarn prettify           # Prettier format all src files
yarn clean              # Remove dist/
```

Uses `yarn` (not npm) for builds (`cross-env` + webpack + `yarn tsc`). Publishing uses `npm` — see Publishing section below.

## Architecture

### Reactive Dependency System

The core pattern is a reactive dependency graph managed by `BaseNode` and `Controller`:

- **`BaseNode`** (`src/model/BaseNode.ts`) - Abstract base class for all interactive elements. Has a static `Controller` instance shared across all nodes. Each node has an `update()` function and can declare dependencies on other nodes.
- **`Controller`** (`src/model/Controller.ts`) - Manages a `DependencyGraph` that tracks relationships between elements. When a node changes, dependents are updated in topological order.
- **`DependencyGraph`** (`src/model/DependencyGraph.ts`) - DAG implementation for dependency tracking and ordered update propagation.

### Element Hierarchy

`BaseElement` (extends `BaseNode`) is the base for all SVG visual elements:

- `src/elements/svg/` - SVG primitive wrappers: Circle, Rectangle, Path, Line, Text, Group, etc. Each wraps a native SVG element accessible via `.root`.
- `src/elements/input/` - Interactive controls: Slider, Button, CheckBox, RadioControl, Control (draggable point).
- `src/layouts/` - Layout components: HolyGrail, Pancake, Player, SideBar.

### Key Top-Level Classes

- **`Frame`** (`src/Frame.ts`) - SVG canvas container; the root element for creating visualizations.
- **`CoordinateSystem`** (`src/CoordinateSystem.ts`) - 2D math coordinate system with axes, grid, labels.
- **`Scene`** (`src/Scene.ts`) - Animation sequencing with easing functions (linear, easeIn, easeOut, easeInOut, wait).
- **`Player`** (`src/Player.ts`) / **`ScenePlayer`** (`src/ScenePlayer.ts`) - Playback UI controls.
- **`Theme`** (`src/Theme.ts`) - Singleton theme manager (light/dark mode) using CSS custom properties.
- **`Color`** (`src/Color.ts`) - Color utilities integrated with Theme.

### 3D Graphics

`src/quaternions/` contains 3D math and rendering: Quaternion, Vector2, Vector3, Camera (trackball), Scene3D, CoordinateSystem3D.

### Modules

`src/modules/plot/` - Plotting components: Plot, PlotGridBased, TrigPlot.

## Code Style

- Prettier: 4-space tabs, single quotes, trailing comma ES5, 100 char print width, semicolons.
- TypeScript strict mode is OFF. No strict null checks.
- Target: ES2020. Module: ES2020.

## Build Outputs

- `dist/lib/` - ES2020 modules (tsc output, used as package main entry)
- `dist/vector.js` - UMD bundle (Webpack)

## Testing

Jest 29 with ts-jest in jsdom environment. Tests live in `src/tests/` and as adjacent `.test.ts` files. Snapshot testing is used for SVG output verification.

## Publishing

See the `vector-publish` skill for the full publishing workflow. Uses `npm` (not yarn) for versioning and publishing. The `preversion` hook runs clean + build + test — if anything fails, the version bump silently aborts.
