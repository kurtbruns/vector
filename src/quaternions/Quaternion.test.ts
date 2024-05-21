import { Quaternion } from './Quaternion';
import { Vector2 } from './Vector2';
import { Vector3 } from './Vector3';


/**
 * Compares the real number components of two Quaternions
 */
function expectQuaternionsEqual(q1 : Quaternion, q2 : Quaternion) {
    expect(q1.a).toBe(q2.a);
    expect(q1.b).toBe(q2.b);
    expect(q1.c).toBe(q2.c);
    expect(q1.d).toBe(q2.d);
}

/**
 * Compares the coordinates of two vectors
 */
function expectVectorsEqual(v1 : Vector3, v2 : Vector3, numDigits: number = 10) {
    expect(v1.x).toBeCloseTo(v2.x, numDigits);
    expect(v1.y).toBeCloseTo(v2.y, numDigits);
    expect(v1.z).toBeCloseTo(v2.z, numDigits);
}

describe('Quaternion Multiplcation', () => {

    describe('Fundamental Units', () => {
        
        test('i^2 = -1', () => {
            let q = new Quaternion(0, 1, 0, 0);
            let actual = q.multiply(q);
            let expected = new Quaternion(-1, 0, 0, 0);
            expectQuaternionsEqual(actual, expected);
        })

        test('j^2 = -1', () => {
            let q = new Quaternion(0, 0, 1, 0);
            let actual = q.multiply(q);
            let expected = new Quaternion(-1, 0, 0, 0);
            expectQuaternionsEqual(actual, expected);
        })

        test('k^2 = -1', () => {
            let q = new Quaternion(0, 0, 0, 1);
            let actual = q.multiply(q);
            let expected = new Quaternion(-1, 0, 0, 0);
            expectQuaternionsEqual(actual, expected);
        })

        test('ij = k', () => {
            let q = new Quaternion(0, 1, 0, 0);
            let r = new Quaternion(0, 0, 1, 0);
            let actual = q.multiply(r);
            let expected = new Quaternion(0, 0, 0, 1);
            expectQuaternionsEqual(actual, expected);
        })

        test('jk = i', () => {
            let q = new Quaternion(0, 0, 1, 0);
            let r = new Quaternion(0, 0, 0, 1);
            let actual = q.multiply(r);
            let exptected = new Quaternion(0, 1, 0, 0);
            expectQuaternionsEqual(actual, exptected);
        })

        test('ki = j', () => {
            let q = new Quaternion(0, 0, 0, 1);
            let r = new Quaternion(0, 1, 0, 0);
            let actual = q.multiply(r);
            let expected = new Quaternion(0, 0, 1, 0);
            expectQuaternionsEqual(actual, expected);
        })

        test('ji = -k', () => {
            let q = new Quaternion(0, 0, 1, 0);
            let r = new Quaternion(0, 1, 0, 0);
            let actual = q.multiply(r);
            let expected = new Quaternion(0, 0, 0, -1);
            expectQuaternionsEqual(actual, expected);
        })

        test('kj = -i', () => {
            let q = new Quaternion(0, 0, 0, 1);
            let r = new Quaternion(0, 0, 1, 0);
            let actual = q.multiply(r);
            let expectd = new Quaternion(0, -1, 0, 0);
            expectQuaternionsEqual(actual, expectd);
        })

        test('ik = -j', () => {
            let q = new Quaternion(0, 1, 0, 0);
            let r = new Quaternion(0, 0, 0, 1);
            let actual = q.multiply(r);
            let expected = new Quaternion(0, 0, -1, 0);
            expectQuaternionsEqual(actual, expected);
        })
    })

    test('Identity', () => {
        let q = new Quaternion(1, 0, 0, 0);
        let r = new Quaternion(2, 3, 5, 7);
        let expected = new Quaternion(2, 3, 5, 7);
        expectQuaternionsEqual(q.multiply(r), expected);
        expectQuaternionsEqual(r.multiply(q), expected);
    })

    describe('Vector Rotation', () => {

        let r = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);

        test('Input 1', () => {

            let v = new Vector3(0, 0, 1);
            let actual = v.apply(r);
            let expected = new Vector3(0, 0, -1);
            expectVectorsEqual(actual, expected);
    
        })

        test('Input 2', () => {
    
            let v = new Vector3(0, -1, 0);
            let actual = v.apply(r);
            let expected = new Vector3(0, 1, 0);
            expectVectorsEqual(actual, expected);
    
        })
    })

    describe('Another Vector Rotation', () => {

        let r = Quaternion.fromAxisAngle(new Vector3(0, 0, 1), 3/2 * Math.PI);

        test('Input 1', () => {

            let v = new Vector3(1, 0, 0);
            let actual = v.apply(r);
            let expected = new Vector3(0, -1, 0);
            expectVectorsEqual(actual, expected);
    
        })

        test('Input 2', () => {
    
            let v = new Vector3(0, 0, 1);
            let actual = v.apply(r);
            let expected = new Vector3(0, 0, 1);
            expectVectorsEqual(actual, expected);
    
        })
    })



    


    test('Quarter rotation about x-axis', () => {
        let i = Quaternion.fromVector(new Vector3(1, 0, 0));
        let j = Quaternion.fromVector(new Vector3(0, 1, 0));
        let k = Quaternion.fromVector(new Vector3(0, 0, 1));

        let q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        let ti = q.multiply(i).multiply(q.inverse());
        let tj = q.multiply(j).multiply(q.inverse());
        let tk = q.multiply(k).multiply(q.inverse());

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