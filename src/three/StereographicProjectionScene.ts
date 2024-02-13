import { Quaternion } from "./Quaternion";
import { Scene3D } from "./Scene3D";
import { Vector2 } from "./Vector2";
import { Vector3 } from "./Vector3";
import { stereographicProjection } from "./StereographicProjection";
import { CoordinateSystem, Point } from "..";

type Color = [number, number, number];

export class StereographicProjectionScene extends CoordinateSystem {
    constructor(scene: Scene3D) {
        let width = 800;
        let aspectRatio = 16 / 9;
        let gridHeight = 4.5;

        // let aspectRatio = 1;
        super({
            big: true,
            // half: true,
            gridWidth: gridHeight * aspectRatio,
            gridHeight: gridHeight,
            width: width,
            height: width / aspectRatio,
        });

        // console.log(stereographicProjection(new Vector3(0,0,1)))
        // console.log(stereographicProjection(new Vector3(0, 0, -1)))
        // console.log(stereographicProjection(new Vector3(1, 0, 0)))
        // console.log(stereographicProjection(new Vector3(0, 1, 0)))
        // console.log(stereographicProjection(new Vector3(-1, 0, 0)))
        // console.log(stereographicProjection(new Vector3(0, -1, 0)))


        // this.drawSphere(3, 100);
        let origin = this.plot.SVGToRelative(0, 0);
        let unit = this.plot.SVGToRelative(1, 0);

        this.frame.circle(this.frame.width / 2, this.frame.height / 2, unit.x - origin.x)
            .setAttribute('stroke', 'var(--font-color)')
            .setAttribute('stroke-width', '1.5')
            .setAttribute('opacity', '0.4');

        // this.frame.root.style.clipPath = `circle(${width/2}px at center)`;
        let s = 16;
        let points = this.generateSpherePoints(s, s);
        // let points = Scene3D.generateSpherePointsEuler(1, 150);

        const colors: Color[] = [
            [0, 255, 0], [0, 255, 255], [255, 0, 0], [255, 0, 255], [0, 0, 255], [255, 255, 0]
        ];

        let half = false;
        let end = half ? points.length / 2 + s / 2 : points.length;
        for (let i = 0; i < end; i++) {
            let v2: Vector2;
            let p = new Point();
            let q = points[points.length - i - 1]
            let color = this.colorToRGB(this.rgbBlendOnSphere2(q, colors))
            let gp = this.frame.gridPoint(this.plot, p, color);
            gp.style.opacity = '0.75';
            gp.r = 2;
            // gp.style.display = 'none';

            p.addDependency(scene.camera);
            p.update = () => {
                try {

                    v2 = stereographicProjection(q, scene.camera.orientation);
                    p.x = v2.x;
                    p.y = v2.y;
                    // gp.style.display = 'block';

                } catch (error) {

                }
            }



            // this.frame.drawPoint(this.stereographicProjection(points[i])

        }
        scene.camera.updateDependents()

        // let points = this.generateSpherePoints(12, 12);

        // const colors: Color[] = [
        //     [0, 255, 0], [0, 255, 255], [255, 0, 0], [255, 0, 255], [0, 0, 255], [255, 255, 0]
        // ];

        // for (let i = 0; i < points.length; i++) {

        //     this.drawPoint(points[i].copy().scale(3), this.colorToRGB(this.rgbBlendOnSphere2(points[i], colors)), 1);
        // }

    }

    stereographicProjection1(v3: Vector3): Vector2 {

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

    generateSpherePoints(numPointsPerLatitude: number, numLatitudes: number): Vector3[] {
        let points: Vector3[] = [];

        for (let latIndex = 0; latIndex <= numLatitudes; latIndex++) {
            // Compute the latitude angle, ranging from -90 to 90 degrees
            let lat = (Math.PI / 2) - (Math.PI * latIndex / numLatitudes);

            // Exclude poles, as they don't have multiple points
            if (latIndex === 0 || latIndex === numLatitudes) {
                points.push(this.convertSphericalToCartesian(lat, 0));
                continue;
            }

            for (let longIndex = 0; longIndex < numPointsPerLatitude; longIndex++) {
                // Compute the longitude angle, ranging from 0 to 360 degrees
                let long = (2 * Math.PI * longIndex / numPointsPerLatitude);
                points.push(this.convertSphericalToCartesian(lat, long));
            }
        }

        return points;
    }

    convertSphericalToCartesian(latitude: number, longitude: number): Vector3 {
        // Assuming radius is 1
        let x = Math.cos(latitude) * Math.cos(longitude);
        let y = Math.cos(latitude) * Math.sin(longitude);
        let z = Math.sin(latitude);

        return new Vector3(x, y, z)
    }

}