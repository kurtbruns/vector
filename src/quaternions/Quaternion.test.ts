import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

/**
 * Compares the real number components of two Quaternions
 */
function expectQuaternionsEqual(q1 : Quaternion, q2 : Quaternion, numDigits: number = 10) {
    expect(q1.w).toBeCloseTo(q2.w, numDigits);
    expect(q1.x).toBeCloseTo(q2.x, numDigits);
    expect(q1.y).toBeCloseTo(q2.y, numDigits);
    expect(q1.z).toBeCloseTo(q2.z, numDigits);
}

/**
 * Compares the coordinates of two vectors
 */
function expectVectorsEqual(v1 : Vector3, v2 : Vector3, numDigits: number = 10) {
    expect(v1.x).toBeCloseTo(v2.x, numDigits);
    expect(v1.y).toBeCloseTo(v2.y, numDigits);
    expect(v1.z).toBeCloseTo(v2.z, numDigits);
}


describe('Quaternion Transform', () => {
    
    test('Identity', () => {

        let i = new Vector3(1, 0, 0);
        let j = new Vector3(0, 1, 0)
        let k = new Vector3(0, 0, 1)

        let q = new Quaternion(1, 0, 0, 0);

        // standard position
        expectVectorsEqual(q.transform(i), i);
        expectVectorsEqual(q.transform(j), j);
        expectVectorsEqual(q.transform(k), k);

    })

    test('Quarter rotation about x-axis', () => {

        let i = new Vector3(1, 0, 0);
        let j = new Vector3(0, 1, 0)
        let k = new Vector3(0, 0, 1)

        let q = new Quaternion(1, 0, 0, 0);
        let r = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);

        // apply the rotation
        q = r.multiply(q);

        expectVectorsEqual(q.transform(i), new Vector3(1, 0, 0));
        expectVectorsEqual(q.transform(j), new Vector3(0, 0, 1));
        expectVectorsEqual(q.transform(k), new Vector3(0, -1, 0));

    })

    test('Rotate -2π/3 radians around the axis [1 1 1]', () => {

        let i = new Vector3(1, 0, 0);
        let j = new Vector3(0, 1, 0)
        let k = new Vector3(0, 0, 1)

        let q = new Quaternion(1, 0, 0, 0);
        let r = Quaternion.fromAxisAngle(new Vector3(1, 1, 1), -2/3*Math.PI);

        // apply the rotation
        q = r.multiply(q);

        expectVectorsEqual(q.transform(i), new Vector3(0, 0, 1));
        expectVectorsEqual(q.transform(j), new Vector3(1, 0, 0));
        expectVectorsEqual(q.transform(k), new Vector3(0, 1, 0));

    })

    test('Combined rotations', () => {

        let i = new Vector3(1, 0, 0);
        let j = new Vector3(0, 1, 0)
        let k = new Vector3(0, 0, 1)

        let q = new Quaternion(1, 0, 0, 0);
        let r1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI/2);
        let r2 = Quaternion.fromAxisAngle(new Vector3(1, 1, 1), -2*Math.PI/3);

        // apply the first rotation
        q = r1.multiply(q);

        expectVectorsEqual(q.transform(i), new Vector3(1, 0, 0));
        expectVectorsEqual(q.transform(j), new Vector3(0, 0, 1));
        expectVectorsEqual(q.transform(k), new Vector3(0, -1, 0));

        // then apply the second rotation
        q = r2.multiply(q);

        expectVectorsEqual(q.transform(i), new Vector3(0, 0, 1));
        expectVectorsEqual(q.transform(j), new Vector3(0, 1, 0));
        expectVectorsEqual(q.transform(k), new Vector3(-1, 0, 0));

    })

    test('Combined rotations other way', () => {

        let i = new Vector3(1, 0, 0);
        let j = new Vector3(0, 1, 0)
        let k = new Vector3(0, 0, 1)

        let q = new Quaternion(1, 0, 0, 0);
        let r1 = Quaternion.fromAxisAngle(new Vector3(1, 1, 1), -2*Math.PI/3);
        let r2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI/2);

        // apply the first rotation
        q = r1.multiply(q);

        expectVectorsEqual(q.transform(i), new Vector3(0, 0, 1));
        expectVectorsEqual(q.transform(j), new Vector3(1, 0, 0));
        expectVectorsEqual(q.transform(k), new Vector3(0, 1, 0));

        // then apply the second rotation
        q = r2.multiply(q);

        expectVectorsEqual(q.transform(i), new Vector3(0, -1, 0));
        expectVectorsEqual(q.transform(j), new Vector3(1, 0, 0));
        expectVectorsEqual(q.transform(k), new Vector3(0, 0, 1));

    })



})

describe('Quaternion Multiplication', () => {

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

})

describe('Quaternion.transform', () => {

    test('Quarter rotation about x-axis', () => {

        let i = new Vector3(1, 0, 0);
        let j = new Vector3(0, 1, 0)
        let k = new Vector3(0, 0, 1)

        let q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
        let ti = q.transform(i);
        let tj = q.transform(j);
        let tk = q.transform(k);

        // i-hat stays in place
        expect(ti.x).toBeCloseTo(i.x, 10);
        expect(ti.y).toBeCloseTo(i.y, 10);
        expect(ti.z).toBeCloseTo(i.z, 10);

        // j-hat rotates to k-hat
        expect(tj.x).toBeCloseTo(k.x, 10);
        expect(tj.y).toBeCloseTo(k.y, 10);
        expect(tj.z).toBeCloseTo(k.z, 10);

        // k-hat rotates to negative j-hat
        expect(tk.x).toBeCloseTo(-j.x, 10);
        expect(tk.y).toBeCloseTo(-j.y, 10);
        expect(tk.z).toBeCloseTo(-j.z, 10);
    })

    test('One-third of a full rotation around the axis [1 1 1]', () => {

        let i = new Vector3(1, 0, 0);
        let j = new Vector3(0, 1, 0)
        let k = new Vector3(0, 0, 1)

        let q = Quaternion.fromAxisAngle(new Vector3(1, 1, 1), 2/3*Math.PI);
        let ti = q.transform(i);
        let tj = q.transform(j);
        let tk = q.transform(k);

        // i-hat goes to j-hat
        expectVectorsEqual(ti, j);

        // j-hat rotates to k-hat
        expectVectorsEqual(tj, k);

        // k-hat rotates to i-hat
        expectVectorsEqual(tk, i);

    })
})

// describe('Quaternion.fromDirection', () => {

//     test('Standard direction (positive Z direction)', () => {
//         let q1 = Quaternion.fromDirection(new Vector3(0, 0, 1));
//         let q2 = new Quaternion(1, 0, 0, 0);
//         expect(q1.equals(q2)).toBe(true);
//     });

//     test('Negative z direction', () => {
//         const result = Quaternion.fromDirection(new Vector3(0, 0, -1));
//         const expected = new Quaternion(0, -1, 0, 0);
//         // Could also be the below, because the quaternions q and −q represent the same rotation
//         // const expected = new Quaternion(0, 1, 0, 0);
//         expect(result.w).toBeCloseTo(expected.w, 10);
//         expect(result.x).toBeCloseTo(expected.x, 10);
//         expect(result.y).toBeCloseTo(expected.y, 10);
//         expect(result.z).toBeCloseTo(expected.z, 10);
//     });

//     test('Positive x direction', () => {
//         const result = Quaternion.fromDirection(new Vector3(1, 0, 0));
//         const expected = new Quaternion(Math.cos(Math.PI / 4), 0, Math.cos(Math.PI / 4), 0);
//         expect(result.w).toBeCloseTo(expected.w, 10);
//         expect(result.x).toBeCloseTo(expected.x, 10);
//         expect(result.y).toBeCloseTo(expected.y, 10);
//         expect(result.z).toBeCloseTo(expected.z, 10);
//     });

//     test('Negative x direction', () => {
//         const result = Quaternion.fromDirection(new Vector3(-1, 0, 0));
//         const expected = new Quaternion(Math.cos(Math.PI / 4), 0, -Math.cos(Math.PI / 4), 0);
//         expect(result.w).toBeCloseTo(expected.w, 10);
//         expect(result.x).toBeCloseTo(expected.x, 10);
//         expect(result.y).toBeCloseTo(expected.y, 10);
//         expect(result.z).toBeCloseTo(expected.z, 10);
//     });

//     test('Positive y direction', () => {
//         const result = Quaternion.fromDirection(new Vector3(0, 1, 0));
//         const expected = new Quaternion(Math.cos(Math.PI / 4), -Math.cos(Math.PI / 4), 0, 0);
//         expect(result.w).toBeCloseTo(expected.w, 10);
//         expect(result.x).toBeCloseTo(expected.x, 10);
//         expect(result.y).toBeCloseTo(expected.y, 10);
//         expect(result.z).toBeCloseTo(expected.z, 10);
//     });

//     test('Negative y direction', () => {
//         const result = Quaternion.fromDirection(new Vector3(0, -1, 0));
//         const expected = new Quaternion(Math.cos(Math.PI / 4), Math.cos(Math.PI / 4), 0, 0);
//         expect(result.w).toBeCloseTo(expected.w, 10);
//         expect(result.x).toBeCloseTo(expected.x, 10);
//         expect(result.y).toBeCloseTo(expected.y, 10);
//         expect(result.z).toBeCloseTo(expected.z, 10);
//     });

// });