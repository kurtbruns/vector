import { Scene3D } from "./Scene3D"

export class TrackBall extends Scene3D {
    constructor() {
        super({
            gridWidth:0.032,
            gridHeight: 0.032,
            size: 2,
            tickMarks: false,
            groundGrid: false,

        });
        this.drawCube(2, false);
        // this.drawSphere(1, 100);
    }
}