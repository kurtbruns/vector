import { BaseNode } from "../model";
import { Vector3 } from "./Vector3";

export class Quaternion extends BaseNode {

    a: number;
    b: number;
    c: number;
    d: number;

    constructor(a: number = 0, b: number = 0, c: number = 0, d: number = 0) {
        super();
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    /**
    * Returns the identity quaternion (1, 0, 0, 0).
    */
    static identity(): Quaternion {
        return new Quaternion(1, 0, 0, 0);
    }

    /**
     * Returns the reference direction (Positve Z Axis)
     */
    static standardForwardDirection(): Vector3 {
        return new Vector3(0, 0, 1);
    }

    /**
     * Returns a quaternion from a vector (vector part of the quaternion)
     */
    static fromVector(vector: Vector3): Quaternion {
        return new Quaternion(0, vector.x, vector.y, vector.z);
    }


    static orientationBetween(from: Vector3, to: Vector3): Quaternion {

        // Calculate the direction from the camera to the target
        let direction = to.subtract(from).normalize();

        // Calculate and return the desired orientation
        return Quaternion.fromDirection(direction);
    }

    static fromDirection(direction: Vector3): Quaternion {

        // Reference direction (positive Z-axis)
        const reference = this.standardForwardDirection();

        // Normalizing the input direction
        direction = direction.normalize();

        // Calculating the rotation axis (cross product)
        const rotationAxis = reference.cross(direction);

        // Check if the rotation axis is the zero vector
        if (rotationAxis.isZero()) {
            if (reference.equals(direction)) {
                // Parallel: No rotation needed
                return Quaternion.identity();
            } else {
                // Anti-Parallel: 180-degree rotation around an arbitrary perpendicular axis
                const perpendicularAxis = reference.findPerpendicular();
                return Quaternion.fromAxisAngle(perpendicularAxis, Math.PI);
            }
        } else {
            // Normalizing the rotation axis
            rotationAxis.normalize();

            // Calculating the angle between the reference and the direction
            const angle = Math.acos(reference.dot(direction));

            // Return quaternion representing the rotation
            return Quaternion.fromAxisAngle(rotationAxis, angle);
        }

    }

    static fromAxisAngle(axis: Vector3, angle: number): Quaternion {
        let halfAngle = angle / 2;
        let sinHalfAngle = Math.sin(halfAngle);
        return new Quaternion(
            Math.cos(halfAngle),
            axis.x * sinHalfAngle,
            axis.y * sinHalfAngle,
            axis.z * sinHalfAngle
        );
    }

    // Instance method for spherical linear interpolation
    static slerp(q1: Quaternion, q2: Quaternion, t: number): Quaternion {

        if (t <= 0) {
            return q1;
        }
        
        if (t >= 1) {
            return q2;
        }

        let cosHalfTheta = q1.d * q2.d + q1.a * q2.a + q1.b * q2.b + q1.c * q2.c;

        // Choose the shorter path
        if (cosHalfTheta < 0) {
            q2 = new Quaternion(-q2.a, -q2.b, -q2.c, -q2.d);
            cosHalfTheta = -cosHalfTheta;
        }

        if (cosHalfTheta >= 1.0) {
            return q1;
        }

        const halfTheta = Math.acos(cosHalfTheta);
        const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

        if (Math.abs(sinHalfTheta) < 0.001) {
            return new Quaternion(
                (1 - t) * q1.a + t * q2.a,
                (1 - t) * q1.b + t * q2.b,
                (1 - t) * q1.c + t * q2.c,
                (1 - t) * q1.d + t * q2.d
            ).normalize();
        }

        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

        return new Quaternion(
            ratioA * q1.a + ratioB * q2.a,
            ratioA * q1.b + ratioB * q2.b,
            ratioA * q1.c + ratioB * q2.c,
            ratioA * q1.d + ratioB * q2.d
        ).normalize();
    }

    static lookAt(source: Vector3, target: Vector3): Quaternion {
        source = source.normalize();
        target = target.normalize();

        const dot = source.dot(target);

        if (dot < -0.999999) {
            // Vectors are opposite
            let tempVec = new Vector3(1, 0, 0).cross(source);
            if (tempVec.length() < 0.001) {
                tempVec = new Vector3(0, 1, 0).cross(source);
            }
            tempVec.normalize();
            return Quaternion.fromAxisAngle(tempVec, Math.PI);
        } else if (dot > 0.999999) {
            // Vectors are the same
            return new Quaternion(0, 0, 0, 1);
        } else {
            const axis = source.cross(target);
            const angle = Math.acos(dot);
            return Quaternion.fromAxisAngle(axis, -angle);
        }
    }

    static lookAtWithUp(source: Vector3, target: Vector3, up: Vector3 = Quaternion.standardForwardDirection()): Quaternion {

        // Normalize the input vectors
        source = source.normalize();
        target = target.normalize();
        up = up.normalize();

        // Calculate forward vector
        let forward = target.subtract(source).normalize();

        // Calculate the right vector
        let right = forward.cross(up).normalize();

        // Recalculate the up vector to ensure orthogonality
        up = right.cross(forward).normalize();

        // Create a rotation matrix
        let m: number[] = [
            right.x, right.y, right.z,
            up.x, up.y, up.z,
            -forward.x, -forward.y, -forward.z
        ];

        // Convert the rotation matrix to a quaternion and return
        return Quaternion.fromRotationMatrix(m);
    }

    static fromRotationMatrix(m: number[]): Quaternion {
        // Ensure that the input is a flat array representing a 3x3 matrix
        if (m.length !== 9) {
            throw new Error("The input must be a flat array of length 9 representing a 3x3 matrix.");
        }

        // Calculate the trace of the matrix
        let trace = m[0] + m[4] + m[8];

        let x, y, z, w;

        if (trace > 0) {
            let S = Math.sqrt(trace + 1.0) * 2; // S=4*qw 
            w = 0.25 * S;
            x = (m[7] - m[5]) / S;
            y = (m[2] - m[6]) / S;
            z = (m[3] - m[1]) / S;
        } else if ((m[0] > m[4]) && (m[0] > m[8])) {
            let S = Math.sqrt(1.0 + m[0] - m[4] - m[8]) * 2; // S=4*qx 
            w = (m[7] - m[5]) / S;
            x = 0.25 * S;
            y = (m[1] + m[3]) / S;
            z = (m[2] + m[6]) / S;
        } else if (m[4] > m[8]) {
            let S = Math.sqrt(1.0 + m[4] - m[0] - m[8]) * 2; // S=4*qy
            w = (m[2] - m[6]) / S;
            x = (m[1] + m[3]) / S;
            y = 0.25 * S;
            z = (m[5] + m[7]) / S;
        } else {
            let S = Math.sqrt(1.0 + m[8] - m[0] - m[4]) * 2; // S=4*qz
            w = (m[3] - m[1]) / S;
            x = (m[2] + m[6]) / S;
            y = (m[5] + m[7]) / S;
            z = 0.25 * S;
        }

        return new Quaternion(w, x, y, z);
    }

    // Converts the quaternion to a 3x3 rotation matrix represented as a flat array
    toRotationMatrix(): number[] {
        const matrix = new Array(9);

        const xx = this.b * this.b;
        const yy = this.c * this.c;
        const zz = this.d * this.d;
        const xy = this.b * this.c;
        const xz = this.b * this.d;
        const yz = this.c * this.d;
        const ax = this.a * this.b;
        const ay = this.a * this.c;
        const az = this.a * this.d;

        // Row 1
        matrix[0] = 1 - 2 * (yy + zz);
        matrix[1] = 2 * (xy - az);
        matrix[2] = 2 * (xz + ay);

        // Row 2
        matrix[3] = 2 * (xy + az);
        matrix[4] = 1 - 2 * (xx + zz);
        matrix[5] = 2 * (yz - ax);

        // Row 3
        matrix[6] = 2 * (xz - ay);
        matrix[7] = 2 * (yz + ax);
        matrix[8] = 1 - 2 * (xx + yy);

        return matrix;
    }

    set(q: Quaternion) {
        this.a = q.a;
        this.b = q.b;
        this.c = q.c;
        this.d = q.d;
        this.updateDependents();
    }

    getUpAxis(): Vector3 {
        const matrix = this.toRotationMatrix();
        return new Vector3(matrix[1], matrix[4], matrix[7]); // Extracting the second column for the up axis
    }

    // Extracts the right axis (x-axis) from the quaternion
    getRightAxis(): Vector3 {
        const matrix = this.toRotationMatrix();
        return new Vector3(matrix[0], matrix[3], matrix[6]); // Extracting the first column for the right axis
    }

    add(q: Quaternion): Quaternion {
        return new Quaternion(this.a + q.a, this.b + q.b, this.c + q.c, this.d + q.d);
    }

    subtract(q: Quaternion): Quaternion {
        return new Quaternion(this.a - q.a, this.b - q.b, this.c - q.c, this.d - q.d);
    }

    multiply(q: Quaternion): Quaternion {
        return new Quaternion(
            this.a * q.a - this.b * q.b - this.c * q.c - this.d * q.d,
            this.a * q.b + this.b * q.a + this.c * q.d - this.d * q.c,
            this.a * q.c - this.b * q.d + this.c * q.a + this.d * q.b,
            this.a * q.d + this.b * q.c - this.c * q.b + this.d * q.a
        );
    }

    norm(): number {
        return Math.sqrt(this.a * this.a + this.b * this.b + this.c * this.c + this.d * this.d);
    }

    conjugate(): Quaternion {
        return new Quaternion(this.a, -this.b, -this.c, -this.d);
    }

    inverse(): Quaternion {
        let normSquared = this.a * this.a + this.b * this.b + this.c * this.c + this.d * this.d;
        return new Quaternion(this.a / normSquared, -this.b / normSquared, -this.c / normSquared, -this.d / normSquared);
    }

    rotatePoint(point: Vector3): Vector3 {
        let pointQuaternion = new Quaternion(0, point.x, point.y, point.z);
        let rotatedQuaternion = this.multiply(pointQuaternion).multiply(this.inverse());
        return new Vector3(rotatedQuaternion.b, rotatedQuaternion.c, rotatedQuaternion.d);
    }

    normalize(): Quaternion {
        let norm = this.norm();
        if (norm === 0) {
            throw new Error("Cannot normalize a quaternion with a norm of 0.");
        }
        return new Quaternion(this.a / norm, this.b / norm, this.c / norm, this.d / norm);
    }

    copy(): Quaternion {
        return new Quaternion(this.a, this.b, this.c, this.d);
    }

    toFormattedString() {
        return `${this.a.toFixed(2)} + ${this.b.toFixed(2)}i + ${this.c.toFixed(2)}j + ${this.d.toFixed(2)}k`;
    }

    toString(): string {
        return `${this.a} + ${this.b}i + ${this.c}j + ${this.d}k`;
    }

    toVector3(): Vector3 {
        return new Vector3(this.b, this.c, this.d);
    }

    toConstructor(format: (number) => string = (n) => { return Number(n).toString() }): string {
        return `new Quaternion(${format(this.a)}, ${format(this.b)}, ${format(this.c)}, ${format(this.d)})`
    }

    equals(other: Quaternion): boolean {
        return this.a === other.a && this.b === other.b && this.c === other.c && this.d === other.d;
    }

    get animate() {
        const context: Quaternion = this;

        return {
            set: function (endPoint: { a: number, b: number, c: number, d: number }) {
                let hasStarted = false;
                let a: number;
                let b: number;
                let c: number;
                let d: number;

                return (alpha: number) => {
                    if (!hasStarted) {
                        a = context.a;
                        b = context.b;
                        c = context.c;
                        d = context.d;
                        hasStarted = true;
                    }
                    context.a = a + (endPoint.a - a) * alpha;
                    context.b = b + (endPoint.b - b) * alpha;
                    context.c = c + (endPoint.c - c) * alpha;
                    context.d = d + (endPoint.d - d) * alpha;
                    context.updateDependents();
                };
            },
            slerp: function (r: Quaternion) {
                let hasStarted = false;
                let q : Quaternion;
                let u : Quaternion;

                return (alpha: number) => {
                    if (!hasStarted) {
                        q = context.copy();
                        // u = r.multiply(q).multiply(r.conjugate());
                        u = r.multiply(q);
                        hasStarted = true;
                        // console.log('start q:', q.toFormattedString());
                        // console.log('rotation r:', r.toFormattedString());
                        // console.log('dest u:', u.toFormattedString());
                    }
                    let t = Quaternion.slerp(q, u, alpha);
                    // console.log(t.toFormattedString());
                    context.set(t);
                };
            },
        };
    }
}
