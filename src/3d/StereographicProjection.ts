import { Quaternion } from "./Quaternion";
import { Vector2 } from "./Vector2";
import { Vector3 } from "./Vector3";

export function stereographicProjection(v: Vector3, r: Quaternion = new Quaternion(0, 0, 0, 1)): Vector2 {

    // Check if the input point is the same as the projection point
    if (v.equals(r.toVector3())) {
        throw new Error("Cannot project the point at the projection point");
    }

    const u = Quaternion.fromAxisAngle(new Vector3(0,0,1), Math.PI/2);

    let a = r.multiply(Quaternion.fromVector(v));
    let t = v.copy().applyQuaternion(a).normalize();

    const x2 = - t.x / (1 - t.z );
    const y2 = - t.y / (1 - t.z);
    return new Vector2(x2, y2);
}
