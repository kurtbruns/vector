import { Point } from "../model";
import { Quaternion } from "./Quaternion";
import { Scene3D } from "./Scene3D";
import { Vector2 } from "./Vector2";
import { Vector3 } from "./Vector3";

type Color = [number, number, number];

export class Cube extends Scene3D {
    constructor() {
        super({
            groundGrid: false,
            // tickMarks: false,
            // cameraOrientation: new Quaternion(0.178, 0.459, -0.035, 0.870),
            // cameraPosition: new Vector3(16.216, 2.060, 11.524),

            // cameraOrientation: Quaternion.fromVector(new Vector3(0,0,1)),
            // cameraPosition: new Vector3(0,0,10),

            cameraOrientation: Quaternion.fromVector(new Vector3(1,0,0)),
            cameraPosition: new Vector3(0,0,10),
        });

        let c = 5;
        let drawPoints = true;
        let points = [];

        // this.testPoint(new Vector3(1, 0, 0), 'var(--green)');
        // this.testPoint(new Vector3(0, 1, 0), 'var(--red)');
        this.testPoint(new Vector3(0, 0, 1), 'var(--blue)');


        // let t1 = new Vector3(-c, -c, c);
        // let t2 = new Vector3(c, -c, c);
        // let t3 = new Vector3(c, c, c);
        // let t4 = new Vector3(-c, c, c);

        // if (drawPoints) {
        //     points.push(this.drawPoint(t1, 'var(--muted-primary)'));
        //     points.push(this.drawPoint(t2, 'var(--muted-primary)'));
        //     points.push(this.drawPoint(t3, 'var(--muted-primary)'));
        //     points.push(this.drawPoint(t4, 'var(--muted-primary)'));
        // }


        // this.line(t1, t2, 'var(--muted-primary)');
        // this.line(t2, t3, 'var(--muted-primary)');
        // this.line(t3, t4, 'var(--muted-primary)');
        // this.line(t4, t1, 'var(--muted-primary)');

        // // middle
        // // this.drawPoint(new Vector3(-2, -2, 0), '#404040');
        // // this.drawPoint(new Vector3(2, -2, 0), '#404040');
        // // this.drawPoint(new Vector3(2, 2, 0), '#404040');
        // // this.drawPoint(new Vector3(-2, 2, 0), '#404040');

        // // bottom

        // let b1 = new Vector3(-c, -c, -c);
        // let b2 = new Vector3(c, -c, -c);
        // let b3 = new Vector3(c, c, -c);
        // let b4 = new Vector3(-c, c, -c);

        // if (drawPoints) {
        //     points.push(this.drawPoint(b1, 'var(--muted-primary)'));
        //     points.push(this.drawPoint(b2, 'var(--muted-primary)'));
        //     points.push(this.drawPoint(b3, 'var(--muted-primary)'));
        //     points.push(this.drawPoint(b4, 'var(--muted-primary)'));
        // }

        // this.line(b1, b2, 'var(--muted-primary)');
        // this.line(b2, b3, 'var(--muted-primary)');
        // this.line(b3, b4, 'var(--muted-primary)');
        // this.line(b4, b1, 'var(--muted-primary)');

        // this.line(t1, b1, 'var(--muted-primary)');
        // this.line(t2, b2, 'var(--muted-primary)');
        // this.line(t3, b3, 'var(--muted-primary)');
        // this.line(t4, b4, 'var(--muted-primary)');


    }

    testPoint(p: Vector3, color: string) {

        let q = this.camera.projectPoint(p);
        q.addDependency(p, this.camera);
        q.update = () => {
            q = this.camera.projectPoint(p);
            // console.log(q.z);
        }
        // q.update();

        let vbox = this.viewPort.frame.viewBox.split(/[\s,]+/).map(Number)
        let z = this.viewPort.frame.circle(0, 0, 3);
        z.setAttribute('fill', color);
        z.setAttribute('opacity', `${1}`);
        z.addDependency(q)
        z.update = () => {
            let relativePoint = this.viewPort.plot.SVGToRelative(q.x, q.y);
            z.cx = relativePoint.x + vbox[0];
            z.cy = relativePoint.y + vbox[1];
            z.r = 50 / q.z ;
            console.log(q.z)
        }
        z.update();

        let r = new Point(0, 0);
        r.addDependency(z);
        r.update = () => {
            r.x = z.cx;
            r.y = z.cy;
        }
        r.update();

    }

}