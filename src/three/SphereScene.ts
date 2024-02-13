import { Quaternion } from "./Quaternion";
import { Scene3D } from "./Scene3D";
import { Vector2 } from "./Vector2";
import { Vector3 } from "./Vector3";

type Color = [number, number, number];

export class SphereScene extends Scene3D {
    constructor() {
        let width = 480;
        super({

            cameraOrientation: new Quaternion(0.379, 0.193, -0.410, 0.807),
            cameraPosition: new Vector3(5.595, -4.647, 5.302),
            
            groundGrid: true,
            controls: false,
            width: width,
            height: width,
            tickMarks: false,
            size: 2,

            // cameraOrientation: new Quaternion(0.000, 0.000, -0.000, 1.000), 
            // cameraPosition: new Vector3(0.000, -0.000, 18.000),

            // cameraOrientation: new Quaternion(0, -0.25, 0.25, 1), 
            // cameraPosition: new Vector3(-7.235, 7.542, 10.760),

            // cameraOrientation: new Quaternion(0.829, 0.431, -0.164, 0.316),
            // cameraPosition: new Vector3(8.177, 9.163, 8.613),
        });

        // this.drawSphere(3, 100);

        // this.camera.orientation = this.camera.orientation.multiply(Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 23.5*Math.PI/180));

        let s = 16;
        let points = Scene3D.generateSpherePoints(s, s);
        // let points = Scene3D.generateSpherePointsEuler(1, 150);

        const colors: Color[] = [
            [0, 255, 0], [0, 255, 255], [255, 0, 0], [255, 0, 255], [0, 0, 255], [255, 255, 0]
        ];

        let radius = 1;
        let half = false;
        let end = half ? points.length / 2 + s / 2 : points.length;
        for (let i = 0; i < end; i++) {
            // let p = points[i];
            let p = points[points.length - i - 1];
            this.drawPoint(p.copy().scale(radius), {color:this.colorToRGB(this.rgbBlendOnSphere2(p, colors)), opacity:0.75});

        }

    }

    stereographicProjection(v3: Vector3): Vector2 {

        // Check if the z-coordinate is 1, which is a special case (projection point)
        if (v3.z === 1) {
            throw new Error("Cannot project the point at the top of the sphere (0, 0, 1)");
        }

        const x2 = v3.x / (1 - v3.z);
        const y2 = v3.y / (1 - v3.z);

        return new Vector2(x2, y2);
    }

    colorToRGB(c: Color) {
        return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    }

    rgbBlendOnSphere1(point: Vector3, colors: Color[]): Color {
        return [
            Math.max(point.y * 255, 50),
            Math.max(point.x * 255, 50),
            Math.max(point.z * 255, 50)
        ]
    }


    rgbBlendOnSphere2(point: Vector3, colors: Color[]): Color {
        const normPoint = point.normalize();

        const axes: Vector3[] = [
            new Vector3(1, 0, 0), new Vector3(-1, 0, 0),
            new Vector3(0, 1, 0), new Vector3(0, -1, 0),
            new Vector3(0, 0, 1), new Vector3(0, 0, -1),
        ];

        let weights = axes.map(axis => Math.max(0, normPoint.dot(axis)));

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        if (totalWeight > 0) {
            weights = weights.map(w => w / totalWeight);
        }

        let r = 0, g = 0, b = 0;
        colors.forEach((color, index) => {
            r += weights[index] * color[0];
            g += weights[index] * color[1];
            b += weights[index] * color[2];
        });

        return [r, g, b];
    }


}