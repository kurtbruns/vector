import { BaseNode } from "../model";
import { Quaternion } from "./Quaternion";
import { Vector2 } from "./Vector2";
import { Vector3 } from "./Vector3";

export class Camera extends BaseNode {

    private _position: Vector3;
    private _orientation: Quaternion;
    private _up: Vector3;

    /**
     * Field of view
     */
    fov: number;
    nearPlane: number;
    farPlane: number;

    constructor(position: Vector3, orientation: Quaternion, fov: number, aspectRatio: number, nearPlane: number, farPlane: number) {

        super();

        this._position = position;
        this._orientation = orientation;
        this.fov = fov;
        this.nearPlane = nearPlane;
        this.farPlane = farPlane;

    }

    get forward(): Vector3 {
        return new Vector3(0, 0, -1);
    }

    get position(): Vector3 {
        return this._position;
    }

    set position(p: Vector3) {
        this._position.set(p);
        this.updateDependents();
    }

    get orientation(): Quaternion {
        return this._orientation;
    }

    set orientation(o: Quaternion) {
        this._orientation.set(o);
        this.updateDependents();
    }

    set up(v: Vector3) {
        this._up = v;
    }

    get up(): Vector3 {
        return this._up;
    }

    lookAt(target: Vector3, up: Vector3 = new Vector3(0, 0, -1), newPosition?: Vector3): void {

        if (newPosition) {
            this._position.set(newPosition);
        }

        // Compute the direction vector from the camera to the target
        const direction = target.subtract(this.position).normalize();

        // Calculate the rotation quaternion
        const rotation = Quaternion.lookAtWithUp(this.position, direction, up);

        // Apply the rotation to the camera's orientation
        this._orientation.set(rotation);

        this.updateDependents();
    }

    closestPointOnPlane(point: Vector3, planeQuaternion: Quaternion): Vector3 {

        // Convert the Quaternion to a normal vector
        const normal = planeQuaternion.rotatePoint(Quaternion.standardForwardDirection()).normalize();

        // If you're using the origin as a reference point for the plane
        const planePoint = new Vector3(0, 0, 0);

        // Calculate the closest point on the plane
        const pointToPlane = point.subtract(planePoint);
        const distance = pointToPlane.dot(normal);
        const closestPoint = point.subtract(normal.scale(distance));

        return closestPoint;
    }

    isPointInFrustum(rotatedPoint: Vector3): boolean {

        let aspectRatio = 16/9;

        // Near and far planes
        const z = rotatedPoint.z;
        if (z < this.nearPlane || z > this.farPlane) {
            return false;
        }

        // Left and right planes
        const x = rotatedPoint.x;
        const halfWidthAtZ = z * Math.tan(this.fov * 0.5 * Math.PI / 180) * aspectRatio;
        if (x < -halfWidthAtZ || x > halfWidthAtZ) {
            return false;
        }

        // Top and bottom planes
        const y = rotatedPoint.y;
        const halfHeightAtZ = z * Math.tan(this.fov * 0.5 * Math.PI / 180);
        if (y < -halfHeightAtZ || y > halfHeightAtZ) {
            return false;
        }

        return true;
    }

    /**
     * Projects a point in world space into camera space and returns a Vector3.
     * The x and y components of the returned Vector3 represent the projected coordinates on the camera's viewport.
     * The z component of the returned Vector3 is the distance from the camera to the point in world space.
     * 
     * @param point - The point in world space to be projected.
     * @returns Vector3 - The projected point as x and y coordinates, and the distance from the camera's plane as z.
     */
    projectPoint(point: Vector3, debug = false): Vector3 {

        // Flip the z-coordinate of the point
        let flipped = new Vector3(point.x, point.y, -point.z);

        // Convert the point from world space to camera space
        let relativePoint = flipped.subtract(this.position);

        // Apply quaternion rotation
        let rotatedPoint = relativePoint.apply(this.orientation);

        if (debug) {
            console.log('point', point)
            console.log('relative', relativePoint)
            console.log('rotated', rotatedPoint)
            console.log('isPointInFrustum', this.isPointInFrustum(rotatedPoint))
        }

        // Perspective projection
        let scale = Math.tan(this.fov * 0.5 * Math.PI / 180) * this.nearPlane;
        let projectedX = rotatedPoint.x / rotatedPoint.z * scale;
        let projectedY = rotatedPoint.y / rotatedPoint.z * scale;

        // Return a new Vector3 with the projected x, y, and the distance
        return new Vector3(projectedX, projectedY, this.isPointInFrustum(rotatedPoint) ? 1 : 0);

    }

    rotate(axis: Vector3, angle: number) {
        let q = this.orientation.copy();
        let p = this.position.copy();

        let r = Quaternion.fromAxisAngle(axis.apply(this.orientation), angle);
        let u = r.multiply(q).normalize();

        this._orientation.set(u);
        this._position.set(Quaternion.standardForwardDirection().scale(p.length()).apply(this.orientation.inverse().normalize()));
        this.updateDependents();

    }

    get animate() {

        return {
            rotate: (axis: Vector3, angle: number) => {

                let hasStarted = false;
                let q: Quaternion;
                let slerp: (t: number) => Quaternion;
                let p: Vector3;

                return (alpha: number) => {
                    if (!hasStarted) {
                        q = this.orientation.copy();
                        p = this.position.copy();

                        let r = Quaternion.fromAxisAngle(axis.copy().apply(this.orientation), angle);
                        let u = r.multiply(q).normalize();
                        slerp = Quaternion.createSlerpFunction(q, u);
                        hasStarted = true;
                    }

                    this._orientation.set(slerp(alpha));
                    this._position.set(this.forward.scale(p.length()).apply(this.orientation.inverse().normalize()));

                    this.updateDependents();
                };
            },
            change: (u: Quaternion, d?: number) => {

                let hasStarted = false;
                let q: Quaternion;
                let slerp: (t: number) => Quaternion;
                let pStart: Vector3;
                let startDistance: number;
                let targetDistance: number;

                return (alpha: number) => {
                    if (!hasStarted) {
                        q = this.orientation.copy();

                        // Calculate the starting distance and direction vector
                        startDistance = this.position.length();
                        let direction = this.forward.normalize();

                        pStart = direction.scale(startDistance);
                        targetDistance = d !== undefined ? d : startDistance;

                        slerp = Quaternion.createSlerpFunction(q, u);

                        hasStarted = true;
                    }

                    // Interpolate the distance using alpha
                    let currentDistance = startDistance * (1 - alpha) + targetDistance * alpha;

                    // Set the position vector p at the interpolated distance
                    let p = this.forward.normalize().scale(currentDistance);

                    // Update orientation and position
                    this._orientation.set(slerp(alpha));
                    this._position.set(this.orientation.conjugate().transform(p));
                    this.updateDependents();
                };
            },
            slerp: (u: Quaternion) => {

                let hasStarted = false;
                let q: Quaternion;
                let slerp: (t: number) => Quaternion;
                let p: Vector3;

                return (alpha: number) => {

                    if (!hasStarted) {
                        q = this.orientation.copy();
                        p = this.forward.scale(this.position.length());

                        slerp = Quaternion.createSlerpFunction(q, u);

                        hasStarted = true;
                    }

                    this._orientation.set(slerp(alpha));
                    this._position.set(this.orientation.conjugate().transform(p));
                    this.updateDependents();
                };
            },
            moveTo: (endPoint:{x:number, y:number, z:number}) => {
                let hasStarted = false;
                let startX;
                let startY;
                let startZ;
        
                return (alpha) => {
                    if (!hasStarted) {
                        startX = this.position.x;
                        startY = this.position.y;
                        startZ = this.position.z;
                        hasStarted = true;
                    }
                    this.position.x = startX + (endPoint.x - startX) * alpha;
                    this.position.y = startY + (endPoint.y - startY) * alpha;
                    this.position.z = startZ + (endPoint.z - startZ) * alpha;
                    this.updateDependents();
                };
            },
        };
    }
}

