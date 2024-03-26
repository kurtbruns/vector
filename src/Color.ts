import { Theme } from "./Theme";

export type Color = [number, number, number];

export function hexToRGB(hex: string): Color {
    const rgb = parseInt(hex.replace(/^#/, ''), 16);
    return [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff];
}

export function interpolateColor(color1: string, color2: string, factor: number = 0.5): string {

    let theme = Theme.getInstance();

    // Regex to match the pattern 'var(--some-variable)'
    const varRegex = /^var\((--[^)]+)\)$/;

    // Function to extract variable name and get its value
    function getColorValue(color) {
        const match = color.match(varRegex);
        return match ? theme.getVariable(match[1]) : color;
    }

    color1 = getColorValue(color1);
    color2 = getColorValue(color2);

    const rgb1 = hexToRGB(color1);
    const rgb2 = hexToRGB(color2);

    // Calculate the interpolated color
    const interpolate = (start: number, end: number) => {
        return Math.round(start + factor * (end - start));
    };

    const result = rgb1.map((component, index) => {
        return interpolate(component, rgb2[index]);
    });

    // Convert interpolated rgb back to hex
    return `#${result.map(x => x.toString(16).padStart(2, '0')).join('')}`;
}