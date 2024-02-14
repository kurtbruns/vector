import { BaseNode } from "../model";
import { Vector3Pooling } from "./Vector3Pooling";


class QuaternionPool {
    pool: QuaternionPooling[];
    size: number;
    constructor(size = 56) {
        this.pool = [];
        this.size = size;
        this.init();
    }

    private init() {
        for (let i = 0; i < this.size; i++) {
            this.pool.push(new QuaternionPooling());
        }
    }

    get(a = 0, b = 0, c = 0, d = 0) {
        if (this.pool.length > 0) {
            const q = this.pool.pop();
            q.a = a;
            q.b = b;
            q.c = c;
            q.d = d;
            return q;
        } else {
            console.warn('Exceeded pool size, creating a new instance.');
            return new QuaternionPooling(a, b, c, d);
        }
    }

    release(q: QuaternionPooling) {
        if (this.pool.length < this.size) {
            q.a = 0;
            q.b = 0;
            q.c = 0;
            q.d = 0;
            // q.reset();
            this.pool.push(q);
        }
    }
}

export class QuaternionPooling extends BaseNode {

    private static _pool :QuaternionPool;

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

    static get pool() : QuaternionPool {
        if (!QuaternionPooling._pool) {
            QuaternionPooling._pool = new QuaternionPool();
        }
        return QuaternionPooling._pool;
    }

    /**
    * Returns the identity quaternion (1, 0, 0, 0).
    */
    static identity(): QuaternionPooling {
        return QuaternionPooling.pool.get(1, 0, 0, 0);
    }

    /**
     * Returns the reference direction (Positve Z Axis)
     */
    static standardForwardDirection(): Vector3Pooling {
        return Vector3Pooling.pool.get(0, 0, 1);
    }

    /**
     * Returns a quaternion from a vector (vector part of the quaternion)
     */
    static fromVector(vector: Vector3Pooling): QuaternionPooling {
        return QuaternionPooling.pool.get(0, vector.x, vector.y, vector.z);
    }


    static orientationBetween(from: Vector3Pooling, to: Vector3Pooling): QuaternionPooling {

        // Calculate the direction from the camera to the target
        let direction = to.subtract(from).normalize();

        // Calculate and return the desired orientation
        return QuaternionPooling.fromDirection(direction);
    }

    static fromDirection(direction: Vector3Pooling): QuaternionPooling {

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
                return QuaternionPooling.identity();
            } else {
                // Anti-Parallel: 180-degree rotation around an arbitrary perpendicular axis
                const perpendicularAxis = reference.findPerpendicular();
                return QuaternionPooling.fromAxisAngle(perpendicularAxis, Math.PI);
            }
        } else {
            // Normalizing the rotation axis
            rotationAxis.normalize();

            // Calculating the angle between the reference and the direction
            const angle = Math.acos(reference.dot(direction));

            // Return quaternion representing the rotation
            return QuaternionPooling.fromAxisAngle(rotationAxis, angle);
        }

    }

    static fromAxisAngle(axis: Vector3Pooling, angle: number): QuaternionPooling {
        let halfAngle = angle / 2;
        let sinHalfAngle = Math.sin(halfAngle);
        return QuaternionPooling.pool.get(
            Math.cos(halfAngle),
            axis.x * sinHalfAngle,
            axis.y * sinHalfAngle,
            axis.z * sinHalfAngle
        );
    }

    // Instance method for spherical linear interpolation
    static slerp(q1: QuaternionPooling, q2: QuaternionPooling, t: number): QuaternionPooling {

        if (t <= 0) {
            return q1;
        }
        
        if (t >= 1) {
            return q2;
        }

        let cosHalfTheta = q1.d * q2.d + q1.a * q2.a + q1.b * q2.b + q1.c * q2.c;

        if (cosHalfTheta < 0) {
            q2 = new QuaternionPooling(-q2.a, -q2.b, -q2.c, -q2.d);
            cosHalfTheta = -cosHalfTheta;
        }

        if (cosHalfTheta >= 1.0) {
            return q1;
        }

        const halfTheta = Math.acos(cosHalfTheta);
        const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

        if (Math.abs(sinHalfTheta) < 0.001) {
            return QuaternionPooling.pool.get(
                (1 - t) * q1.a + t * q2.a,
                (1 - t) * q1.b + t * q2.b,
                (1 - t) * q1.c + t * q2.c,
                (1 - t) * q1.d + t * q2.d
            ).normalize();
        }

        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

        return QuaternionPooling.pool.get(
            ratioA * q1.a + ratioB * q2.a,
            ratioA * q1.b + ratioB * q2.b,
            ratioA * q1.c + ratioB * q2.c,
            ratioA * q1.d + ratioB * q2.d
        ).normalize();
    }

    static lookAt(source: Vector3Pooling, target: Vector3Pooling): QuaternionPooling {
        source = source.normalize();
        target = target.normalize();

        const dot = source.dot(target);

        if (dot < -0.999999) {
            // Vectors are opposite
            let tempVec = new Vector3Pooling(1, 0, 0).cross(source);
            if (tempVec.length() < 0.001) {
                tempVec = new Vector3Pooling(0, 1, 0).cross(source);
            }
            tempVec.normalize();
            return QuaternionPooling.fromAxisAngle(tempVec, Math.PI);
        } else if (dot > 0.999999) {
            // Vectors are the same
            return new QuaternionPooling(0, 0, 0, 1);
        } else {
            const axis = source.cross(target);
            const angle = Math.acos(dot);
            return QuaternionPooling.fromAxisAngle(axis, -angle);
        }
    }

    static lookAtWithUp(source: Vector3Pooling, target: Vector3Pooling, up: Vector3Pooling = QuaternionPooling.standardForwardDirection()): QuaternionPooling {

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
        return QuaternionPooling.fromRotationMatrix(m);
    }

    static fromRotationMatrix(m: number[]): QuaternionPooling {
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

        return new QuaternionPooling(w, x, y, z);
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

    set(q: QuaternionPooling) {
        this.a = q.a;
        this.b = q.b;
        this.c = q.c;
        this.d = q.d;
        this.updateDependents();
    }

    getUpAxis(): Vector3Pooling {
        const matrix = this.toRotationMatrix();
        return new Vector3Pooling(matrix[1], matrix[4], matrix[7]); // Extracting the second column for the up axis
    }

    // Extracts the right axis (x-axis) from the quaternion
    getRightAxis(): Vector3Pooling {
        const matrix = this.toRotationMatrix();
        return new Vector3Pooling(matrix[0], matrix[3], matrix[6]); // Extracting the first column for the right axis
    }

    add(q: QuaternionPooling): QuaternionPooling {
        return QuaternionPooling.pool.get(this.a + q.a, this.b + q.b, this.c + q.c, this.d + q.d);
    }

    subtract(q: QuaternionPooling): QuaternionPooling {
        return QuaternionPooling.pool.get(this.a - q.a, this.b - q.b, this.c - q.c, this.d - q.d);
    }

    multiply(q: QuaternionPooling): QuaternionPooling {
        return QuaternionPooling.pool.get(
            this.a * q.a - this.b * q.b - this.c * q.c - this.d * q.d,
            this.a * q.b + this.b * q.a + this.c * q.d - this.d * q.c,
            this.a * q.c - this.b * q.d + this.c * q.a + this.d * q.b,
            this.a * q.d + this.b * q.c - this.c * q.b + this.d * q.a
        );
    }

    norm(): number {
        return Math.sqrt(this.a * this.a + this.b * this.b + this.c * this.c + this.d * this.d);
    }

    conjugate(): QuaternionPooling {
        return QuaternionPooling.pool.get(this.a, -this.b, -this.c, -this.d);
    }

    inverse(): QuaternionPooling {
        let normSquared = this.a * this.a + this.b * this.b + this.c * this.c + this.d * this.d;
        return QuaternionPooling.pool.get(this.a / normSquared, -this.b / normSquared, -this.c / normSquared, -this.d / normSquared);
    }

    rotatePoint(point: Vector3Pooling): Vector3Pooling {
        let pointQuaternion = QuaternionPooling.pool.get(0, point.x, point.y, point.z);
        let rotatedQuaternion = this.multiply(pointQuaternion).multiply(this.inverse());
        return Vector3Pooling.pool.get(rotatedQuaternion.b, rotatedQuaternion.c, rotatedQuaternion.d);
    }

    normalize(): QuaternionPooling {
        let norm = this.norm();
        if (norm === 0) {
            throw new Error("Cannot normalize a quaternion with a norm of 0.");
        }
        return QuaternionPooling.pool.get(this.a / norm, this.b / norm, this.c / norm, this.d / norm);
    }

    copy(): QuaternionPooling {
        return QuaternionPooling.pool.get(this.a, this.b, this.c, this.d);
    }

    toString(): string {
        return `${this.a} + ${this.b}i + ${this.c}j + ${this.d}k`;
    }

    toVector3(): Vector3Pooling {
        return new Vector3Pooling(this.b, this.c, this.d);
    }

    toConstructor(format: (number) => string = (n) => { return Number(n).toString() }): string {
        return `new Quaternion(${format(this.a)}, ${format(this.b)}, ${format(this.c)}, ${format(this.d)})`
    }

    equals(other: QuaternionPooling): boolean {
        return this.a === other.a && this.b === other.b && this.c === other.c && this.d === other.d;
    }

    get animate() {
        const context: QuaternionPooling = this;

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
        };
    }
}
