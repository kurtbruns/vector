import { BaseNode } from "../model";
import { Vector3 } from "./Vector3";

export enum EulerOrder {
    XYZ = 'XYZ',
    XZY = 'XZY',
    YXZ = 'YXZ',
    YZX = 'YZX',
    ZXY = 'ZXY',
    ZYX = 'ZYX',
}

export class Quaternion extends BaseNode {


    w: number;
    x: number;
    y: number;
    z: number;

    /**
     * Constructs a new Quaternion in the form a + bi + ci + di
     */
    constructor(a: number = 0, b: number = 0, c: number = 0, d: number = 0) {
        super();
        this.w = a;
        this.x = b;
        this.y = c;
        this.z = d;
    }

    /**
    * Returns the identity quaternion 1 + 0i + 0j + 0k
    */
    static identity(): Quaternion {
        return new Quaternion(1, 0, 0, 0);
    }

    /**
     * Returns the reference direction (Positve Z Axis)
     */
    static standardForwardDirection(): Vector3 {
        return new Vector3(0, 0, -1);
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
        return Quaternion.fromDirection(direction).normalize();
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
    
    static fromEulerAngles(roll: number, pitch: number, yaw: number, order: EulerOrder = EulerOrder.XYZ): Quaternion {
        const halfX = roll / 2;
        const halfY = pitch / 2;
        const halfZ = yaw / 2;
    
        const cosX = Math.cos(halfX);
        const sinX = Math.sin(halfX);
    
        const cosY = Math.cos(halfY);
        const sinY = Math.sin(halfY);
    
        const cosZ = Math.cos(halfZ);
        const sinZ = Math.sin(halfZ);
    
        let w, x, y, z;
    
        switch (order) {
            case EulerOrder.XZY:
                w = cosX * cosY * cosZ + sinX * sinY * sinZ;
                x = sinX * cosY * cosZ + cosX * sinY * sinZ;
                y = cosX * sinY * cosZ - sinX * cosY * sinZ;
                z = cosX * cosY * sinZ - sinX * sinY * cosZ;
                break;
    
            case EulerOrder.YXZ:
                w = cosX * cosY * cosZ + sinX * sinY * sinZ;
                x = sinX * cosY * cosZ - cosX * sinY * sinZ;
                y = cosX * sinY * cosZ + sinX * cosY * sinZ;
                z = cosX * cosY * sinZ - sinX * sinY * cosZ;
                break;
    
            case EulerOrder.YZX:
                w = cosX * cosY * cosZ + sinX * sinY * sinZ;
                x = sinX * cosY * cosZ + cosX * sinY * sinZ;
                y = cosX * sinY * cosZ - sinX * cosY * sinZ;
                z = cosX * cosY * sinZ - sinX * sinY * cosZ;
                break;
    
            case EulerOrder.ZXY:
                w = cosX * cosY * cosZ - sinX * sinY * sinZ;
                x = sinX * cosY * cosZ + cosX * sinY * sinZ;
                y = cosX * sinY * cosZ + sinX * cosY * sinZ;
                z = cosX * cosY * sinZ - sinX * sinY * cosZ;
                break;
    
            case EulerOrder.ZYX:
                w = cosX * cosY * cosZ + sinX * sinY * sinZ;
                x = sinX * cosY * cosZ - cosX * sinY * sinZ;
                y = cosX * sinY * cosZ + sinX * cosY * sinZ;
                z = cosX * cosY * sinZ - sinX * sinY * cosZ;
                break;
    
            case EulerOrder.XYZ:
            default:
                w = cosX * cosY * cosZ - sinX * sinY * sinZ;
                x = sinX * cosY * cosZ + cosX * sinY * sinZ;
                y = cosX * sinY * cosZ - sinX * cosY * sinZ;
                z = cosX * cosY * sinZ + sinX * sinY * cosZ;
                break;
        }
    
        return new Quaternion(w, x, y, z);
    }

    /**
     * Creates a quaternion representing a rotation around a specified axis by a given angle.
     * 
     * @param axis The rotation axis
     * @param angle The rotation angle in radians.
     * @return A new Quaternion object representing the specified rotation.
     */
    static fromAxisAngle(axis: Vector3, angle: number): Quaternion {
        let normalized = axis;
        if (axis.length() !== 1) {
            normalized = axis.normalize();
        }
        let halfAngle = angle / 2;
        let sinHalfAngle = Math.sin(halfAngle);
        return new Quaternion(
            Math.cos(halfAngle),
            normalized.x * sinHalfAngle,
            normalized.y * sinHalfAngle,
            normalized.z * sinHalfAngle
        );
    }

    // Factory function to create a SLERP function with pre-computed constants
    static createSlerpFunction(q1: Quaternion, q2: Quaternion, shortestPath: boolean = true) {

        let cosHalfTheta = q1.z * q2.z + q1.w * q2.w + q1.x * q2.x + q1.y * q2.y;
        let adjustedQ2 = q2;

        // Adjust q2 for the shortest path and recompute cosHalfTheta if needed
        if (cosHalfTheta < 0 && shortestPath) {
            adjustedQ2 = new Quaternion(-q2.w, -q2.x, -q2.y, -q2.z);
            cosHalfTheta = -cosHalfTheta;
        }

        if (cosHalfTheta >= 1.0) {
            // If the quaternions are essentially the same, return an interpolation of q1
            return (t: number) => {
                return new Quaternion(
                    (1 - t) * q1.w + t * q1.w,
                    (1 - t) * q1.x + t * q1.x,
                    (1 - t) * q1.y + t * q1.y,
                    (1 - t) * q1.z + t * q1.z
                ).normalize();
            };
        }

        const halfTheta = Math.acos(cosHalfTheta);
        const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

        // Return a function that only computes the final interpolation
        return (t: number): Quaternion => {
            if (Math.abs(sinHalfTheta) < 0.001) {
                return new Quaternion(
                    (1 - t) * q1.w + t * adjustedQ2.w,
                    (1 - t) * q1.x + t * adjustedQ2.x,
                    (1 - t) * q1.y + t * adjustedQ2.y,
                    (1 - t) * q1.z + t * adjustedQ2.z
                ).normalize();
            }

            const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
            const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

            return new Quaternion(
                ratioA * q1.w + ratioB * adjustedQ2.w,
                ratioA * q1.x + ratioB * adjustedQ2.x,
                ratioA * q1.y + ratioB * adjustedQ2.y,
                ratioA * q1.z + ratioB * adjustedQ2.z
            ).normalize();
        };
    }

    // Instance method for spherical linear interpolation
    static slerp(q1: Quaternion, q2: Quaternion, t: number, shortestPath = true): Quaternion {

        if (t <= 0) {
            return q1;
        }

        if (t >= 1) {
            return q2;
        }

        let cosHalfTheta = q1.z * q2.z + q1.w * q2.w + q1.x * q2.x + q1.y * q2.y;

        // Choose the shorter path
        if (cosHalfTheta < 0 && shortestPath) {
            q2 = new Quaternion(-q2.w, -q2.x, -q2.y, -q2.z);
            cosHalfTheta = -cosHalfTheta;
        }

        if (cosHalfTheta >= 1.0) {
            return q1;
        }

        const halfTheta = Math.acos(cosHalfTheta);
        const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

        if (Math.abs(sinHalfTheta) < 0.001) {
            return new Quaternion(
                (1 - t) * q1.w + t * q2.w,
                (1 - t) * q1.x + t * q2.x,
                (1 - t) * q1.y + t * q2.y,
                (1 - t) * q1.z + t * q2.z
            ).normalize();
        }

        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

        return new Quaternion(
            ratioA * q1.w + ratioB * q2.w,
            ratioA * q1.x + ratioB * q2.x,
            ratioA * q1.y + ratioB * q2.y,
            ratioA * q1.z + ratioB * q2.z
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

        const xx = this.x * this.x;
        const yy = this.y * this.y;
        const zz = this.z * this.z;
        const xy = this.x * this.y;
        const xz = this.x * this.z;
        const yz = this.y * this.z;
        const ax = this.w * this.x;
        const ay = this.w * this.y;
        const az = this.w * this.z;

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

    static rotationToVector(v: Vector3): Quaternion {

        const normalized = v.normalize();
        const forward = Quaternion.standardForwardDirection();
        const axis = forward.cross(normalized);
        const angle = Math.acos(forward.dot(normalized));

        // No rotation needed
        if (angle === 0) {
            return new Quaternion(1, 0, 0, 0);
        }

        // Vectors are opposite
        if (axis.x === 0 && axis.y === 0 && axis.z === 0) {
            return new Quaternion(0, 1, 0, 0);
        }

        return Quaternion.fromAxisAngle(axis.normalize(), angle);
    }

    transform(v: Vector3) {
        // Convert the vector to a pure quaternion
        let vectorQuaternion = new Quaternion(0, v.x, v.y, v.z);

        // Perform the rotation: q * v * q^(-1)
        let rotatedQuaternion = this.multiply(vectorQuaternion).multiply(this.inverse());

        return new Vector3(rotatedQuaternion.x, rotatedQuaternion.y, rotatedQuaternion.z);
    }

    set(q: Quaternion) {
        this.w = q.w;
        this.x = q.x;
        this.y = q.y;
        this.z = q.z;
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
        return new Quaternion(this.w + q.w, this.x + q.x, this.y + q.y, this.z + q.z);
    }

    subtract(q: Quaternion): Quaternion {
        return new Quaternion(this.w - q.w, this.x - q.x, this.y - q.y, this.z - q.z);
    }

    multiply(q: Quaternion): Quaternion {
        return new Quaternion(
            this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z,
            this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
            this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
            this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w
        );
    }

    /**
     * Raises this quaternion to the power of the given exponent.
     * 
     * @param exponent The exponent to raise the quaternion to.
     * @returns A new quaternion representing the result of the exponentiation.
     */
    pow(exponent: number): Quaternion {
        // Compute the norm (magnitude) of the quaternion
        const norm = this.norm();
        const normPow = Math.pow(norm, exponent);

        // Compute the angle theta
        const theta = Math.acos(this.w / norm);

        // Compute the new scalar part
        const newA = normPow * Math.cos(exponent * theta);

        // If the vector part is zero, return a scalar quaternion
        const vectorMagnitude = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        if (vectorMagnitude === 0) {
            return new Quaternion(newA, 0, 0, 0);
        }

        // Compute the new vector part
        const factor = normPow * Math.sin(exponent * theta) / vectorMagnitude;
        const newB = this.x * factor;
        const newC = this.y * factor;
        const newD = this.z * factor;

        return new Quaternion(newA, newB, newC, newD);
    }

    norm(): number {
        return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
    }

    conjugate(): Quaternion {
        return new Quaternion(this.w, -this.x, -this.y, -this.z);
    }

    negate(): Quaternion {
        return new Quaternion(-this.w, -this.x, -this.y, -this.z);
    }

    inverse(): Quaternion {
        let normSquared = this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z;
        return new Quaternion(this.w / normSquared, -this.x / normSquared, -this.y / normSquared, -this.z / normSquared);
    }

    rotatePoint(point: Vector3): Vector3 {
        let pointQuaternion = new Quaternion(0, point.x, point.y, point.z);
        let rotatedQuaternion = this.multiply(pointQuaternion).multiply(this.inverse());
        return new Vector3(rotatedQuaternion.x, rotatedQuaternion.y, rotatedQuaternion.z);
    }

    normalize(): Quaternion {
        let norm = this.norm();
        if (norm === 0) {
            throw new Error("Cannot normalize a quaternion with a norm of 0.");
        }
        return new Quaternion(this.w / norm, this.x / norm, this.y / norm, this.z / norm);
    }

    /**
     * Returns a copy of this quaternion
     */
    copy(): Quaternion {
        return new Quaternion(this.w, this.x, this.y, this.z)
    }

    /**
     * Returns a string representing this quaternion formatted to 2-digit fixed string decimal.
     */
    toFormattedString(numDigits = 2): string {
        let epsilon = 0.00000001;

        const format = (value: number, isFirst: boolean = false) => {
            if (Math.abs(value) < epsilon) {
                return isFirst ? (0).toFixed(numDigits) : '+' + (0).toFixed(numDigits);
            }
            return (value >= 0 ? (isFirst ? '' : '+') : '') + value.toFixed(numDigits);
        };

        return `${format(this.w, true)} ${format(this.x)}i ${format(this.y)}j ${format(this.z)}k`;
    }

    toString(): string {
        return `${this.w} + ${this.x}i + ${this.y}j + ${this.z}k`;
    }

    toVector3(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    /**
     * Ret
     */
    toConstructor(format: (number) => string = (n) => { return Number(n).toFixed(2) }): string {
        return `new Quaternion(${format(this.w)}, ${format(this.x)}, ${format(this.y)}, ${format(this.z)})`
    }

    /**
     * Returns true if this Quaternion is equal to the other quaternion.
     */
    equals(other: Quaternion): boolean {
        return this.w === other.w && this.x === other.x && this.y === other.y && this.z === other.z;
    }

    /**
     * Returns different animation methods for this Quaternion
     */
    get animate() {

        return {
            /**
             * Linearly interpolates between two quaternions, however use `slerp` if a smooth and uniform rotation is desired
             */
            set: (endPoint: { a: number, b: number, c: number, d: number }) => {
                let hasStarted = false;
                let a: number;
                let b: number;
                let c: number;
                let d: number;

                return (alpha: number) => {
                    if (!hasStarted) {
                        a = this.w;
                        b = this.x;
                        c = this.y;
                        d = this.z;
                        hasStarted = true;
                    }
                    this.w = a + (endPoint.a - a) * alpha;
                    this.x = b + (endPoint.b - b) * alpha;
                    this.y = c + (endPoint.c - c) * alpha;
                    this.z = d + (endPoint.d - d) * alpha;
                    this.updateDependents();
                };
            },
            rotate: (axis: Vector3, angle: number) => {

                let hasStarted = false;
                let q : Quaternion;
                
                return (alpha: number) => {
                    if (!hasStarted) {
                        q = this.copy();
                        hasStarted = true;
                    }
            
                    const currentRotation = alpha*angle % (2 * Math.PI);                    
            
                    // Generate quaternion for the current rotation step
                    const rotationStep = Quaternion.fromAxisAngle(axis, currentRotation);
            
                    // Set the current quaternion to this rotation
                    this.set(rotationStep.multiply(q));
                };
            },
            /**
             * Rotates the current quaternion by the rotation represented by r.
             */
            rotateBy: (r: Quaternion, shortestPath: boolean = true) => {
                let hasStarted = false;
                let q: Quaternion;
                let u: Quaternion;
                let slerp: (t: number) => Quaternion;

                return (alpha: number) => {
                    if (!hasStarted) {
                        q = this.copy();
                        u = r.multiply(q);
                        slerp = Quaternion.createSlerpFunction(q, u, shortestPath);
                        hasStarted = true;
                    }

                    this.set(slerp(alpha));
                };
            },
            /**
             * Smoothly interpolate between two quaternion states.
             */
            slerp: (u: Quaternion, shortestPath: boolean = true) => {
                let hasStarted = false;
                let q: Quaternion;
                let slerp: (t: number) => Quaternion;

                return (alpha: number) => {
                    if (!hasStarted) {
                        q = this.copy();
                        slerp = Quaternion.createSlerpFunction(q, u, shortestPath);
                        hasStarted = true;
                    }

                    this.set(slerp(alpha));
                };
            },
            deCasteljau: (quaternions: Quaternion[], shortestPath: boolean = true) => {
                let hasStarted = false;
                let initialQuaternions: Quaternion[];
            
                return (alpha: number) => {
                    if (!hasStarted) {
                        // Copy the initial set of quaternions
                        initialQuaternions = quaternions.map(q => q.copy());
                        hasStarted = true;
                    }
            
                    // Recursive helper function to perform De Casteljau's algorithm
                    const deCasteljauRecursive = (quats: Quaternion[], t: number): Quaternion => {
                        if (quats.length === 1) {
                            return quats[0];
                        }
            
                        const nextQuats: Quaternion[] = [];
                        for (let i = 0; i < quats.length - 1; i++) {
                            nextQuats.push(Quaternion.slerp(quats[i], quats[i + 1], t, shortestPath));
                        }
            
                        return deCasteljauRecursive(nextQuats, t);
                    };
            
                    // Perform the De Casteljau interpolation with the initial quaternions
                    this.set(deCasteljauRecursive(initialQuaternions, alpha));
                };
            }
        };
    }
}
