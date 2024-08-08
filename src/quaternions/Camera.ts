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
            this._position = newPosition;
        }

        // Compute the direction vector from the camera to the target
        const direction = target.subtract(this.position).normalize();

        // Calculate the rotation quaternion
        const rotation = Quaternion.lookAtWithUp(this.position, direction, up);

        // Apply the rotation to the camera's orientation
        this._orientation = rotation;

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

    /**
     * Projects a point in world space into camera space and returns a Vector3.
     * The x and y components of the returned Vector3 represent the projected coordinates on the camera's viewport.
     * The z component of the returned Vector3 is the distance from the camera to the point in world space.
     * 
     * @param point - The point in world space to be projected.
     * @returns Vector3 - The projected point as x and y coordinates, and the distance from the camera's plane as z.
     */
    projectPoint(point: Vector3): Vector3 {

        // Convert the point from world space to camera space
        let relativePoint = point.subtract(this.position);

        // Apply quaternion rotation
        let rotatedPoint = relativePoint.apply(this.orientation);

        // Perspective projection
        let scale = Math.tan(this.fov * 0.5 * Math.PI / 180) * this.nearPlane;
        let projectedX = rotatedPoint.x / rotatedPoint.z * scale;
        let projectedY = rotatedPoint.y / rotatedPoint.z * scale;

        // let forward = this.orientation.rotatePoint(new Vector3(0, 0, -1)).normalize();

        // // Calculate the dot product between the forward direction and the relative point
        // let depth = Math.abs(relativePoint.dot(forward));

        let depth = relativePoint.length()

        // Return a new Vector3 with the projected x, y, and the distance
        return new Vector3(projectedX, projectedY, depth);

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
                let q : Quaternion;
                let slerp : (t:number) => Quaternion;
                let p : Vector3;

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
                    this._position.set(Quaternion.standardForwardDirection().scale(p.length()).apply(this.orientation.inverse().normalize()));

                    this.updateDependents();
                };
            },
            slerp: (u:Quaternion) => {

                let hasStarted = false;
                let q : Quaternion;
                let slerp : (t:number) => Quaternion;
                let p : Vector3;

                return (alpha: number) => {
                    if (!hasStarted) {
                        q = this.orientation.copy();
                        p = this.position.copy();

                        slerp = Quaternion.createSlerpFunction(q, u);

                        console.log(q.toFormattedString(), '\n', u.toFormattedString())
                        hasStarted = true;
                    }

                    this._orientation.set(slerp(alpha));
                    this._position.set(Quaternion.standardForwardDirection().scale(p.length()).apply(this.orientation.inverse().normalize()));

                    this.updateDependents();
                };
            },
        };
    }
}