import { Theme } from './Theme';

export type Color = [number, number, number];

export function hexToRGB(hex: string): Color {
    const rgb = parseInt(hex.replace(/^#/, ''), 16);
    return [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff];
}

export function parseRGB(rgbString: string): Color {
    const match = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (match) {
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    throw new Error(`Invalid RGB format: ${rgbString}`);
}

export function parseColor(color: string): Color {
    // Check if it's an RGB format
    if (color.startsWith('rgb(')) {
        return parseRGB(color);
    }
    // Assume it's a hex color
    return hexToRGB(color);
}

export function interpolateColor(color1: string, color2: string, factor: number = 0.5): string {
    const theme = Theme.getInstance();

    // Regex to match the pattern 'var(--some-variable)'
    const varRegex = /^var\((--[^)]+)\)$/;

    // Function to extract variable name and get its value
    function getColorValue(color) {
        const match = color.match(varRegex);
        return match ? theme.getVariable(match[1]) : color;
    }

    color1 = getColorValue(color1);
    color2 = getColorValue(color2);

    const rgb1 = parseColor(color1);
    const rgb2 = parseColor(color2);

    // Calculate the interpolated color
    const interpolate = (start: number, end: number) => Math.round(start + factor * (end - start));

    const result = rgb1.map((component, index) => interpolate(component, rgb2[index]));

    // Convert interpolated rgb back to hex
    return `#${result.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
