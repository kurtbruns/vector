
export class Vector2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Yields the components of the vector.
     */
    *[Symbol.iterator]() {
        yield this.x;
        yield this.y;
    }

    /**
     * Scales this vector by the scalar
     * 
     * @param s The scalar value
     */
    scale(s: number): Vector2 {
        this.x *= s;
        this.y *= s;
        return this;
    }

    /**
     * Calculates the length of this vector.
     * 
     * @returns The length of the vector.
     */
    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Normalizes the vector, resulting in a unit vector.
     * 
     * @returns A new Vector3 representing the normalized vector.
     */
    normalize(): Vector2 {
        let length = this.length();
        return new Vector2(this.x / length, this.y / length);
    }

    /**
     * Computes the dot product of this vector and another vector.
     * 
     * @param v The other vector
     * @returns The dot product of the two vectors.
     */
        dot(v: Vector2): number {
            return this.x * v.x + this.y * v.y;
        }
}