import { Quaternion } from './Quaternion';
import { Vector2 } from './Vector2';
import { Vector3 } from './Vector3';

describe('Quaternion.fromDirection', () => {

    test('Test fail', () => {
        expect(false).toBe(true);
    });

    test('Standard direction (positive Z direction)', () => {
        let q1 = Quaternion.fromDirection(new Vector3(0, 0, 1));
        let q2 = new Quaternion(1, 0, 0, 0);
        expect(q1.equals(q2)).toBe(true);
    });

    test('Negative z direction', () => {
        const result = Quaternion.fromDirection(new Vector3(0, 0, -1));
        const expected = new Quaternion(0, -1, 0, 0);
        // Could also be the below, because the quaternions q and −q represent the same rotation
        // const expected = new Quaternion(0, 1, 0, 0);
        expect(result.a).toBeCloseTo(expected.a, 10);
        expect(result.b).toBeCloseTo(expected.b, 10);
        expect(result.c).toBeCloseTo(expected.c, 10);
        expect(result.d).toBeCloseTo(expected.d, 10);
    });

    test('Positive x direction', () => {
        const result = Quaternion.fromDirection(new Vector3(1, 0, 0));
        const expected = new Quaternion(Math.cos(Math.PI / 4), 0, Math.cos(Math.PI / 4), 0);
        expect(result.a).toBeCloseTo(expected.a, 10);
        expect(result.b).toBeCloseTo(expected.b, 10);
        expect(result.c).toBeCloseTo(expected.c, 10);
        expect(result.d).toBeCloseTo(expected.d, 10);
    });

    test('Negative x direction', () => {
        const result = Quaternion.fromDirection(new Vector3(-1, 0, 0));
        const expected = new Quaternion(Math.cos(Math.PI / 4), 0, -Math.cos(Math.PI / 4), 0);
        expect(result.a).toBeCloseTo(expected.a, 10);
        expect(result.b).toBeCloseTo(expected.b, 10);
        expect(result.c).toBeCloseTo(expected.c, 10);
        expect(result.d).toBeCloseTo(expected.d, 10);
    });

    test('Positive y direction', () => {
        const result = Quaternion.fromDirection(new Vector3(0, 1, 0));
        const expected = new Quaternion(Math.cos(Math.PI / 4), -Math.cos(Math.PI / 4), 0, 0);
        expect(result.a).toBeCloseTo(expected.a, 10);
        expect(result.b).toBeCloseTo(expected.b, 10);
        expect(result.c).toBeCloseTo(expected.c, 10);
        expect(result.d).toBeCloseTo(expected.d, 10);
    });

    test('Negative y direction', () => {
        const result = Quaternion.fromDirection(new Vector3(0, -1, 0));
        const expected = new Quaternion(Math.cos(Math.PI / 4), Math.cos(Math.PI / 4), 0, 0);
        expect(result.a).toBeCloseTo(expected.a, 10);
        expect(result.b).toBeCloseTo(expected.b, 10);
        expect(result.c).toBeCloseTo(expected.c, 10);
        expect(result.d).toBeCloseTo(expected.d, 10);
    });

});