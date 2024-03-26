import { Quaternion } from './Quaternion';
import { Vector2 } from './Vector2';
import { Vector3 } from './Vector3';

describe('Quaternion.multiply', () => {

    test('Identity', () => {
        let q = new Quaternion(1, 0, 0, 0);
        let r = new Quaternion(2, 3, 5, 7);
        let u = q.multiply(r);
        expect(u.a).toBe(r.a);
        expect(u.b).toBe(r.b);
        expect(u.c).toBe(r.c);
        expect(u.d).toBe(r.d);
    })

    test('Quarter rotation about x-axis', () => {
        let i = Quaternion.fromVector(new Vector3(1, 0, 0));
        let j = Quaternion.fromVector(new Vector3(0, 1, 0));
        let k = Quaternion.fromVector(new Vector3(0, 0, 1));

        let q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        let ti = q.multiply(i).multiply(q.conjugate());
        let tj = q.multiply(j).multiply(q.conjugate());
        let tk = q.multiply(k).multiply(q.conjugate());

        // i-hat stays in place
        expect(ti.b).toBeCloseTo(i.b, 10);
        expect(ti.c).toBeCloseTo(i.c, 10);
        expect(ti.d).toBeCloseTo(i.d, 10);

        // j-hat rotates to k-hat
        expect(tj.b).toBeCloseTo(k.b, 10);
        expect(tj.c).toBeCloseTo(k.c, 10);
        expect(tj.d).toBeCloseTo(k.d, 10);

        // k-hat rotates to negative j-hat
        expect(tk.b).toBeCloseTo(-j.b, 10);
        expect(tk.c).toBeCloseTo(-j.c, 10);
        expect(tk.d).toBeCloseTo(-j.d, 10);
    })

})

describe('Quaternion.fromDirection', () => {

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