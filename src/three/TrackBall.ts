import { Quaternion } from "./Quaternion";
import { Scene3D } from "./Scene3D"
import { Vector3 } from "./Vector3";


export class TrackBall extends Scene3D {
    constructor() {
        super({
            gridWidth:0.032,
            gridHeight: 0.032,
            distance: 15,
            size: 2,
            tickMarks: false,
            groundGrid: false,

        });
        this.drawCube(2, false);
        // this.drawSphere(1, 100);
    }
}