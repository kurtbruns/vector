import { QuaternionPooling } from "./QuaternionPooling";
import { Scene3D } from "./Scene3D"
import { Vector3Pooling } from "./Vector3Pooling";


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