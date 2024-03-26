import { Quaternion } from '.';
import { BaseNode } from '../model';

/**
 * Represents a three-dimensional vector.
 */
export class Vector3 extends BaseNode {

    x: number;
    y: number;
    z: number;

    /**
     * Constructs a new Vector3 instance.
     * 
     * @param x The x-component of the vector.
     * @param y The y-component of the vector.
     * @param z The z-component of the vector.
     */
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Yields the components of the vector.
     */
    *[Symbol.iterator]() {
        yield this.x;
        yield this.y;
        yield this.z;
    }

    static unitVector(pitch: number, yaw: number) {
        const x = Math.cos(yaw) * Math.cos(pitch);
        const y = Math.sin(pitch);
        const z = Math.sin(yaw) * Math.cos(pitch);

        return new Vector3(x, y, z);
    }

    static xAxis(): Vector3 {
        return new Vector3(1, 0, 0);
    }

    static yAxis(): Vector3 {
        return new Vector3(0, 1, 0);
    }

    static zAxis(): Vector3 {
        return new Vector3(0, 0, 1);
    }

    get animate() {
        const context : Vector3 = this;
    
        return {
            moveTo: function (endPoint:{x:number, y:number, z:number}) {
                let hasStarted = false;
                let startX;
                let startY;
                let startZ;
    
                return (alpha) => {
                    if (!hasStarted) {
                        startX = context.x;
                        startY = context.y;
                        startZ = context.z;
                        hasStarted = true;
                    }
                    context.x = startX + (endPoint.x - startX) * alpha;
                    context.y = startY + (endPoint.y - startY) * alpha;
                    context.z = startZ + (endPoint.z - startZ) * alpha;
                    context.updateDependents();
                };
            },
        };
    }

    /**
    * Sets this vector equal to the provided vector.
    */
    set(v: Vector3) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
    }

    /**
     * Scales this vector by the scalar
     * 
     * @param s The scalar value
     */
    scale(s: number): Vector3 {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    /**
     * Adds this vector to another vector.
     * 
     * @param v The vector to add.
     * @returns A new Vector3 representing the sum of the two vectors.
     */
    add(v: Vector3): Vector3 {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    /**
     * Subtracts another vector from this vector.
     * 
     * @param v The vector to subtract.
     * @returns A new Vector3 representing the difference.
     */
    subtract(v: Vector3): Vector3 {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    /**
     * Calculates the dot product of this vector with another vector.
     * 
     * @param v The other vector.
     * @returns The dot product as a number.
     */
    dot(v: Vector3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    /**
     * Calculates the length of this vector.
     * 
     * @returns The length of the vector.
     */
    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    /**
     * Normalizes the vector, resulting in a unit vector.
     * 
     * @returns A new Vector3 representing the normalized vector.
     */
    normalize(): Vector3 {
        let length = this.length();
        return new Vector3(this.x / length, this.y / length, this.z / length);
    }

    /**
     * Calculates the cross product of this vector with another vector.
     * 
     * @param v The other vector.
     * @returns A new Vector3 representing the cross product.
     */
    cross(v: Vector3): Vector3 {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }

    /**
     * Checks if the vector is a zero vector (all components are 0).
     * 
     * @returns True if the vector is a zero vector, false otherwise.
     */
    isZero(): boolean {
        return this.x === 0 && this.y === 0 && this.z === 0;
    }

    /**
     * Compares this vector to another vector for equality.
     * 
     * @param v The vector to compare with.
     * @returns True if the vectors are equal, false otherwise.
     */
    equals(v: Vector3): boolean {
        return this.x === v.x && this.y === v.y && this.z === v.z;
    }

    /**
     * Finds a vector that is perpendicular to this vector.
     * 
     * @returns A new Vector3 representing a perpendicular vector.
     */
    findPerpendicular(): Vector3 {
        // If the vector is not along the x-axis, we can cross it with the x-axis.
        // Otherwise, we use the y-axis.
        if (this.x !== 0 || this.z !== 0) {
            return this.cross(new Vector3(0, 1, 0)); // Cross with y-axis
        } else {
            return this.cross(new Vector3(1, 0, 0)); // Cross with x-axis
        }
    }

    inverse() : Vector3 {
        return new Vector3(-this.x, -this.y, -this.z);
    }

    /**
     * 
     * @returns A copy of this vector
     */
    copy(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    /**
     * Applies a quaternion to this vector.
     * 
     * @param q The quaternion to apply.
     * @returns The rotated vector.
     */
    apply(q: Quaternion): this {
        // Convert the vector to a pure quaternion
        let vectorQuaternion = new Quaternion(0, this.x, this.y, this.z);

        // Perform the rotation: q * v * q^(-1)
        // let rotatedQuaternion = q.multiply(vectorQuaternion).multiply(q.inverse());
        let rotatedQuaternion = q.multiply(vectorQuaternion).multiply(q.conjugate());

        // Update the vector with the rotated values
        this.x = rotatedQuaternion.b;
        this.y = rotatedQuaternion.c;
        this.z = rotatedQuaternion.d;
        
        return this;
    }

    toConstructor(format : (number) => string = (n) => { return Number(n).toString() }) : string {
        return `new Vector3(${format(this.x)}, ${format(this.y)}, ${format(this.z)})`
    }
}