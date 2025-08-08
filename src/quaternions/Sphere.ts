import { Circle, Group, Line, Path, Tex } from "..";
import { CoordinateSystem3D } from "./CoordinateSystem3D";
import { QObject } from "./QObject";
import { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";

export interface SphereConfig {
    q?:Quaternion;
}

export class Sphere extends QObject {

    displayTex: Tex;

    constructor(coordinateSystem : CoordinateSystem3D, config:SphereConfig = {}) {

        let defaultConfig = {
            q:new Quaternion(1, 0, 0, 0)
        }

        config = { ...defaultConfig, ...config };

        super(coordinateSystem, config);
    }

    showQuaternionTex(q: Quaternion, center = false, prefix = 'q=') {
        this.displayTex = this.coordinateSystem.plot.frame.tex('');
        this.displayTex.setAttribute('font-size', '18px');

        if (center) {
            this.displayTex.moveTo(this.coordinateSystem.plot.frame.width / 2, 50)
        } else {
            this.displayTex.moveTo(16, 16)
        }

        this.displayTex.addDependency(q);
        this.displayTex.update = () => {
            this.displayTex.replace(prefix + q.toFormattedString());
            if (center) {
                this.displayTex.alignCenter();
            }
        };
        this.displayTex.update();
    }
    
    drawCircle(radius: number, r: Quaternion = Quaternion.identity(), pos: Vector3 = new Vector3(0, 0, 0)) {

        let longs = this.generateCircle(72, radius);
        let opacity = 0.75;
        let path = this.background.path();
        path.setAttribute('stroke', 'var(--font-color)');
        path.setAttribute('stroke-width', '1.5px');
        path.setAttribute('stroke-opacity', `${opacity}`)
        path.addDependency(this.camera, this.q, this.normal, r);
        path.update = () => {

            let p = this.q.transform(pos);
            let q = Quaternion.rotationToVector(p);
            let clip = 0;
            let pathStarted = false;
            let d = '';

            for (let j = 0; j < longs.length; j++) {

                let point = longs[j].copy();
                let t = point.apply(q).add(p);

                let v = this.camera.projectPoint(t);
                if (v.z === 0) {
                    clip++;
                }

                let u = this.coordinateSystem.plot.viewportToFrame(v);

                if (pathStarted) {
                    d += `L ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                } else {
                    d += `M ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                    pathStarted = true; // Start the path
                }
            }


            path.d = clip > longs.length / 2 ? "" : d;
            // path.d = d ;
        }
        path.update();


        return path;
        // this.viewPort.pathArrow(path)
        // path.attatchArrow(this.viewPort.defs, true);

    }


    generateCircle(longs: number, radius: number): Vector3[] {
        let slice: Vector3[] = [];

        let end = Math.floor(1 * longs);
        for (let longIndex = 0; longIndex <= end; longIndex++) {
            let long = (2 * Math.PI * longIndex / longs);

            let p = CoordinateSystem3D.convertSphericalToCartesian(0, long).scale(radius);

            slice.push(p);
        }

        return slice;
    }

    generateVerticalSlices(lats: number, longs: number, r: Quaternion = Quaternion.identity(), skipIndex = 6): Vector3[][] {
        let points: Vector3[][] = [];

        for (let longIndex = 0; longIndex < longs; longIndex++) {

            let slice: Vector3[] = [];

            let long = (2 * Math.PI * longIndex / longs);

            let skip = 12;
            if (longIndex % skipIndex === 0) {
                skip = 0;
            }

            for (let latIndex = skip; latIndex <= lats - skip; latIndex++) {

                let lat = (Math.PI / 2) - (Math.PI * latIndex / lats);

                let p = CoordinateSystem3D.convertSphericalToCartesian(lat, long);

                slice.push(p.apply(r));

            }

            points.push(slice);
        }

        return points;
    }

    drawSphere(r: number = 1, opacity: number = 0.2, drawBackground = true, backgroundColor = 'var(--background-lighter)'): Group {

        let group = this.background.group();
        let lineGroup = group.group();

        let s = 144;
        // let verticalN = 4;
        // let horizontalN = 2;
        let verticalN = 24;
        let horizontalN = 12;
        let identity = Quaternion.identity();

        let longs = this.generateVerticalSlices(s, verticalN, identity);

        for (let i = 0; i < longs.length; i++) {
            let path = lineGroup.path();
            path.setAttribute('stroke', 'var(--medium)');
            path.setAttribute('stroke-width', '1.5px');
            path.setAttribute('stroke-opacity', `${opacity}`)
            path.addDependency(
                this.q,
                this.camera,
                this.camera.position,
                this.camera.orientation
            );
            path.update = () => {

                let lastVisible = false;
                let d = '';
                for (let j = 0; j < longs[i].length; j++) {

                    let point = longs[i][j].copy();
                    let t = point.apply(this.q);

                    // Flip the z-coordinate to be a right-handed system when caclulatig the distance
                    let u = new Vector3(t.x, t.y, -t.z);
                    let distance = this.camera.position.dot(u);

                    if (distance > 1) {
                        let v = this.camera.projectPoint(t);
                        let u = this.coordinateSystem.plot.viewportToFrame(v);

                        if (lastVisible) {
                            d += `L ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                        } else {
                            d += `M ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                            lastVisible = true;
                        }
                    } else {
                        lastVisible = false;
                    }
                }

                path.d = d;
            }
            path.update();
        }

        let lats = CoordinateSystem3D.generateHorizontalSlices(horizontalN, s, identity);


        for (let i = 0; i < lats.length; i++) {
            let path = lineGroup.path();
            path.setAttribute('stroke', 'var(--medium)')
            path.setAttribute('stroke-width', '1.5px')
            path.setAttribute('stroke-opacity', `${opacity}`)
            path.addDependency(
                this.q,
                this.camera,
                this.camera.position,
                this.camera.orientation
            );

            path.update = () => {

                let d = '';
                let lastVisible = false;

                for (let j = 0; j < lats[i].length; j++) {

                    let point = lats[i][j].copy();
                    let t = point.apply(this.q);

                    // Flip the z-coordinate to be a right-handed system when caclulatig the distance
                    let u = new Vector3(t.x, t.y, -t.z);
                    let distance = this.camera.position.dot(u);

                    if (distance > 1) {
                        let v = this.camera.projectPoint(t);
                        let u = this.coordinateSystem.plot.viewportToFrame(v);

                        if (lastVisible) {
                            d += `L ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                        } else {
                            d += `M ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                            lastVisible = true;
                        }
                    } else {
                        lastVisible = false;
                    }
                }

                path.d = d;
            }

            path.update();
        }

        let w = new Vector3();
        // this.drawPoint(w, { color: 'var(--main)' });
        w.addDependency(this.camera);
        w.update = () => {


            let q = this.camera.orientation;
            let c = this.camera.orientation.conjugate();

            const forward = c.multiply(new Quaternion(0, 0, 0, -1)).multiply(q);
            const up = c.multiply(new Quaternion(0, 0, 1, 0)).multiply(q);
            const right = forward.toVector3().cross(up.toVector3());

            // Flip again because it creates bad behavior if ya' don't.
            w.set(new Vector3(right.x, right.y, -right.z));
        }
        w.update();
        // this.vector(this.origin, w, 'var(--yellow)')

        if (drawBackground) {
            let background = group.circle(0, 0, 0);
            background = group.circle(0, 0, 0);
            background.setAttribute('stroke', 'none')
            background.setAttribute('fill', backgroundColor)
            background.setAttribute('opacity', '0.75')
            background.addDependency(this.coordinateSystem.origin, this.camera.position, w);
            background.update = () => {

                let d = this.camera.position.length();

                // https://stackoverflow.com/questions/21648630/radius-of-projected-sphere-in-screen-space#:~:text=Let%20the%20sphere%20have%20radius,can%20be%20written%20as%20f%20.
                let s = d * 1 / Math.sqrt(d * d - 1);
                // let s = 1;

                let center = this.coordinateSystem.plot.viewportToFrame(this.camera.projectPoint(this.coordinateSystem.origin));
                let x = this.coordinateSystem.plot.viewportToFrame(this.camera.projectPoint(w.copy().scale(s)));

                background.cx = center.x;
                background.cy = center.y;
                background.r = Math.hypot(x.y - center.y, x.x - center.x);
            }
            background.update();
            group.prependChild(background);
        }


        let outline = group.circle(0, 0, 0);
        outline.setAttribute('stroke', 'var(--faint)')
        outline.setAttribute('stroke-width', '1.5px')
        outline.setAttribute('stroke-opacity', '1');
        outline.addDependency(this.coordinateSystem.origin, this.camera.position, w);
        outline.update = () => {

            let d = this.camera.position.length();

            // https://stackoverflow.com/questions/21648630/radius-of-projected-sphere-in-screen-space#:~:text=Let%20the%20sphere%20have%20radius,can%20be%20written%20as%20f%20.
            let s = d * 1 / Math.sqrt(d * d - 1);
            // let s = 1;

            let center = this.coordinateSystem.plot.viewportToFrame(this.camera.projectPoint(this.coordinateSystem.origin));
            let x = this.coordinateSystem.plot.viewportToFrame(this.camera.projectPoint(w.copy().scale(s)));

            outline.cx = center.x;
            outline.cy = center.y;
            outline.r = Math.hypot(x.y - center.y, x.x - center.x);
        }
        outline.update();

        return group;

    }

    drawDisappearingCircle(radius: number, r: Quaternion = Quaternion.identity(), pos: Vector3 = new Vector3(0, 0, 0)) {

        let longs = this.generateCircle(72, radius);

        let opacity = 0.75;
        let path = this.background.path();
        path.setAttribute('stroke', 'var(--font-color)');
        path.setAttribute('stroke-width', '1.5px');
        path.setAttribute('stroke-opacity', `${opacity}`)
        path.addDependency(
            this.q,
            this.normal,
            r,
            this.camera,
            this.camera.position,
            this.camera.orientation
        );
        
        path.update = () => {

            let r = this.camera.position.length();

            let u = this.q.transform(pos);
            let q = Quaternion.rotationToVector(u);
            let clip = 0;
            let pathStarted = false;
            let d = '';
            let dotAverage = 0;

            for (let j = 0; j < longs.length; j++) {

                let point = longs[j].copy();
                let t = point.apply(q).add(u);

                // Check if the point is in front of the plane
                let dot = this.normal.dot(t);
                dotAverage += dot;
                if (dot >= 0.2) {
                    let v = this.camera.projectPoint(t);
                    if (v.z === 0) {
                        clip++;
                    }

                    let u = this.coordinateSystem.plot.viewportToFrame(v);
                    // console.log(t)

                    if (pathStarted) {
                        d += `L ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                    } else {
                        d += `M ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                        pathStarted = true; // Start the path
                    }
                } else { // Point is behind plane


                    let s = r * 1 / Math.sqrt(r * r - 1);
                    t = new Vector3(t.x, t.y, 0).normalize().scale(s);

                    let v = this.camera.projectPoint(t);
                    let u = this.coordinateSystem.plot.viewportToFrame(v);

                    if (pathStarted) {
                        d += `L ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                    } else {
                        d += `M ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                        pathStarted = true; // Start the path
                    }

                    // console.log(this.normal.length())

                    clip++;
                }
            }

            path.d = clip === longs.length ? "" : d;

            const opacity = 0.75 * Math.abs(dotAverage / longs.length);

            path.setAttribute('stroke-opacity', opacity.toFixed(2));
            console.log();

            // path.d = d ;
        }
        path.update();

        return path;
        // this.viewPort.pathArrow(path)
        // path.attatchArrow(this.viewPort.defs, true);

    }

    dissappearingVector(v1: Vector3, v2: Vector3, color: string = 'var(--font-color)', opacity = 1): Line {

        v1.addDependency(this.camera);
        v2.addDependency(this.camera);

        let l = this.foreground.line(0, 0, 0, 0)
        l.setAttribute('stroke', color);
        l.setAttribute('opacity', opacity.toString());
        l.setAttribute('stroke-width', '1.5px');
        l.attatchArrow(this.coordinateSystem.plot.frame.definitions, false, color);

        l.addDependency(v1, v2, this.camera.orientation);
        l.update = () => {

            let epsilon = 0.55;
            let dot = this.normal.dot(v1);
            if (dot < -epsilon) {
                l.setAttribute('opacity', '0');
            } else {
                l.setAttribute('opacity', Math.abs(dot + epsilon).toFixed(2));
            }

            let d = this.camera.position.length();

            let s = d * 1 / Math.sqrt(d * d - 1);

            let temp = v1;
            // Arbitrary constant related to a distance of 5
            if (dot <= 0.22) {
                // TODO: this is the bug that makes the vectors looks weird
                temp = this.camera.closestPointOnPlane(v1, this.camera.orientation).normalize().scale(s)
            }

            let t1 = this.camera.projectPoint(temp);
            let t2 = this.camera.projectPoint(v2);

            if (t1.z === 0 || t2.z === 0) {
                l.setAttribute('opacity', '0');
            } else {
                let p1 = this.coordinateSystem.plot.viewportToFrame(t1.x, t1.y);
                let p2 = this.coordinateSystem.plot.viewportToFrame(t2.x, t2.y);

                l.x1 = p1.x;
                l.y1 = p1.y;
                l.x2 = p2.x;
                l.y2 = p2.y;
            }



        }
        l.update();

        return l;
    }

    drawNormalToCamera() {
        let normalToCamera = new Vector3();
        normalToCamera.addDependency(this.camera.orientation);
        normalToCamera.update = () => {
            let v = this.camera.orientation.conjugate().transform(new Vector3(0, 0, -1));
            normalToCamera.set(new Vector3(v.x, v.y, -v.z));
        }
        normalToCamera.update();


        let base = new Vector3();
        base.addDependency(normalToCamera);
        base.update = () => {
            base.set(normalToCamera.scale(1.5));
        }

        this.coordinateSystem.vector(normalToCamera, base)

        return normalToCamera;

    }

    drawVectorOnSphere(v: Vector3, radius: number, multiplier: number = 1.5, color: string = "var(--font-color)") {
        const vStart = new Vector3();
        const vEnd = new Vector3();

        vStart.addDependency(v);
        vStart.update = () => {
            vStart.set(v.normalize().scale(radius));
        };
        vStart.update();

        vEnd.addDependency(v);
        vEnd.update = () => {
            vEnd.set(v.normalize().scale(radius * multiplier));
        };
        vEnd.update();

        return this.dissappearingVector(vStart, vEnd, color);
    }

    drawDependentVectorOnSphere(v: Vector3, radius: number, multiplier: number = 1.5, color: string = "var(--font-color)") {
        const vStart = new Vector3();
        const vEnd = new Vector3();

        vStart.addDependency(v, this.q);
        vStart.update = () => {
            vStart.set(this.q.transform(v.normalize().scale(radius)));
        };
        vStart.update();

        vEnd.addDependency(v, this.q);
        vEnd.update = () => {
            vEnd.set(this.q.transform(v.normalize().scale(radius * multiplier)));
        };
        vEnd.update();

        return this.dissappearingVector(vStart, vEnd, color);
    }

    drawIJKOutOfSphere() {

        // Vector I
        let i = this.drawDependentVectorOnSphere(new Vector3(1, 0, 0), 1, 1.5, 'var(--red)');

        // Vector J
        let j = this.drawDependentVectorOnSphere(new Vector3(0, 1, 0), 1, 1.5, 'var(--green)');

        // Vector K
        let k = this.drawDependentVectorOnSphere(new Vector3(0, 0, 1), 1, 1.5, 'var(--blue)');

        let basisVectors = this.foreground.group();
        basisVectors.appendChild(i);
        basisVectors.appendChild(j);
        basisVectors.appendChild(k);

    }

    drawCirclesOnSphere(s: number = 1, a: number = Math.PI / 12) {

        let t = Math.cos(a);
        let r = Math.sin(a);

        let positiveX = new Vector3(s, 0, 0);
        let positiveY = new Vector3(0, s, 0);
        let positiveZ = new Vector3(0, 0, s);
        let negativeX = new Vector3(-s, 0, 0);
        let negativeY = new Vector3(0, -s, 0);
        let negativeZ = new Vector3(0, 0, -s);


        let positiveXCircle = this.drawDisappearingCircle(r, Quaternion.identity(), positiveX.scale(t));
        positiveXCircle.setAttribute('fill', 'var(--red)');
        positiveXCircle.setAttribute('fill-opacity', '0.4');
        positiveXCircle.setAttribute('stroke', 'var(--red)');

        let positiveYCircle = this.drawDisappearingCircle(r, Quaternion.identity(), positiveY.scale(t));
        positiveYCircle.setAttribute('fill', 'var(--green)');
        positiveYCircle.setAttribute('fill-opacity', '0.4');
        positiveYCircle.setAttribute('stroke', 'var(--green)');

        let positiveZCircle = this.drawDisappearingCircle(r, Quaternion.identity(), positiveZ.scale(t));
        positiveZCircle.setAttribute('fill', 'var(--blue)');
        positiveZCircle.setAttribute('fill-opacity', '0.4');
        positiveZCircle.setAttribute('stroke', 'var(--blue)');

        let negativeXCircle = this.drawDisappearingCircle(r, Quaternion.identity(), negativeX.scale(t));
        negativeXCircle.setAttribute('fill', 'var(--purple)'); // Added fill attribute
        negativeXCircle.setAttribute('fill-opacity', '0.4'); // Added fill-opacity attribute
        negativeXCircle.setAttribute('stroke', 'var(--purple)');

        let negativeYCircle = this.drawDisappearingCircle(r, Quaternion.identity(), negativeY.scale(t));
        negativeYCircle.setAttribute('fill', 'var(--cyan)'); // Added fill attribute
        negativeYCircle.setAttribute('fill-opacity', '0.4'); // Added fill-opacity attribute
        negativeYCircle.setAttribute('stroke', 'var(--cyan)');

        let negativeZCircle = this.drawDisappearingCircle(r, Quaternion.identity(), negativeZ.scale(t));
        negativeZCircle.setAttribute('fill', 'var(--orange)'); // Added fill attribute
        negativeZCircle.setAttribute('fill-opacity', '0.4'); // Added fill-opacity attribute
        negativeZCircle.setAttribute('stroke', 'var(--orange)');
    }


    drawCirclesOnSphereAlt(s: number = 1, a: number = Math.PI / 12) {

        let t = Math.cos(a);
        let r = Math.sin(a);

        let positiveX = new Vector3(s, 0, 0);
        let positiveY = new Vector3(0, s, 0);
        let positiveZ = new Vector3(0, 0, s);
        let negativeX = new Vector3(-s, 0, 0);
        let negativeY = new Vector3(0, -s, 0);
        let negativeZ = new Vector3(0, 0, -s);


        let positiveXCircle = this.drawDisappearingCircle(r, Quaternion.identity(), positiveX.scale(t));
        positiveXCircle.setAttribute('fill', 'var(--red)');
        positiveXCircle.setAttribute('fill-opacity', '0.2');
        positiveXCircle.setAttribute('stroke', 'var(--red)');

        let positiveYCircle = this.drawDisappearingCircle(r, Quaternion.identity(), positiveY.scale(t));
        positiveYCircle.setAttribute('fill', 'var(--green)');
        positiveYCircle.setAttribute('fill-opacity', '0.2');
        positiveYCircle.setAttribute('stroke', 'var(--green)');

        let positiveZCircle = this.drawDisappearingCircle(r, Quaternion.identity(), positiveZ.scale(t));
        positiveZCircle.setAttribute('fill', 'var(--blue)');
        positiveZCircle.setAttribute('fill-opacity', '0.2');
        positiveZCircle.setAttribute('stroke', 'var(--blue)');

        let negativeXCircle = this.drawDisappearingCircle(r, Quaternion.identity(), negativeX.scale(t));
        negativeXCircle.setAttribute('fill', 'var(--medium)');
        negativeXCircle.setAttribute('fill-opacity', '0.1');
        negativeXCircle.setAttribute('stroke', 'var(--red)');

        let negativeYCircle = this.drawDisappearingCircle(r, Quaternion.identity(), negativeY.scale(t));
        negativeYCircle.setAttribute('fill', 'var(--medium)');
        negativeYCircle.setAttribute('fill-opacity', '0.1');
        negativeYCircle.setAttribute('stroke', 'var(--green)');

        let negativeZCircle = this.drawDisappearingCircle(r, Quaternion.identity(), negativeZ.scale(t));
        // negativeZCircle.setAttribute('fill', 'var(--blue)');
        // negativeZCircle.setAttribute('fill-opacity', '0.05');
        negativeZCircle.setAttribute('fill', 'var(--medium)');
        negativeZCircle.setAttribute('fill-opacity', '0.1');
        negativeZCircle.setAttribute('stroke', 'var(--blue)');
    }

    drawOuterCircles(s: number) {

        // let t = Math.cos(Math.PI / 12);
        let t = 1;
        let r = Math.sin(Math.PI / 12);

        let positiveX = new Vector3(s, 0, 0);
        let positiveY = new Vector3(0, s, 0);
        let positiveZ = new Vector3(0, 0, s);
        let negativeX = new Vector3(-s, 0, 0);
        let negativeY = new Vector3(0, -s, 0);
        let negativeZ = new Vector3(0, 0, -s);

        let positiveXCircle = this.drawCircle(r, Quaternion.identity(), positiveX.scale(t));
        positiveXCircle.setAttribute('fill', 'var(--green)');
        positiveXCircle.setAttribute('fill-opacity', '0.4');
        positiveXCircle.setAttribute('stroke', 'var(--green)');

        let positiveYCircle = this.drawCircle(r, Quaternion.identity(), positiveY.scale(t));
        positiveYCircle.setAttribute('fill', 'var(--red)');
        positiveYCircle.setAttribute('fill-opacity', '0.4');
        positiveYCircle.setAttribute('stroke', 'var(--red)');

        let positiveZCircle = this.drawCircle(r, Quaternion.identity(), positiveZ.scale(t));
        positiveZCircle.setAttribute('fill', 'var(--blue)');
        positiveZCircle.setAttribute('fill-opacity', '0.4');
        positiveZCircle.setAttribute('stroke', 'var(--blue)');

        let negativeXCircle = this.drawCircle(r, Quaternion.identity(), negativeX.scale(t));
        negativeXCircle.setAttribute('fill', 'var(--purple)'); // Added fill attribute
        negativeXCircle.setAttribute('fill-opacity', '0.4'); // Added fill-opacity attribute
        negativeXCircle.setAttribute('stroke', 'var(--purple)');

        let negativeYCircle = this.drawCircle(r, Quaternion.identity(), negativeY.scale(t));
        negativeYCircle.setAttribute('fill', 'var(--cyan)'); // Added fill attribute
        negativeYCircle.setAttribute('fill-opacity', '0.4'); // Added fill-opacity attribute
        negativeYCircle.setAttribute('stroke', 'var(--cyan)');

        let negativeZCircle = this.drawCircle(r, Quaternion.identity(), negativeZ.scale(t));
        negativeZCircle.setAttribute('fill', 'var(--orange)'); // Added fill attribute
        negativeZCircle.setAttribute('fill-opacity', '0.4'); // Added fill-opacity attribute
        negativeZCircle.setAttribute('stroke', 'var(--orange)');

        this.background.appendChild(positiveXCircle)
        this.background.appendChild(positiveYCircle)
        this.background.appendChild(positiveZCircle)
        this.background.appendChild(negativeXCircle)
        this.background.appendChild(negativeYCircle)
        this.background.appendChild(negativeZCircle)
    }

    drawOuterSphere(r: number = 10, opacity: number = 0.125, background = true): void {

        let s = 72;
        // let verticalN = 4;
        // let horizontalN = 2;
        let verticalN = 24;
        let horizontalN = 12;
        let identity = Quaternion.identity();

        let longs = CoordinateSystem3D.generateVerticalSlices(s, verticalN, identity);

        for (let i = 0; i < longs.length; i++) {
            let path = this.coordinateSystem.plot.frame.path();
            path.setAttribute('stroke', 'var(--medium)');
            path.setAttribute('stroke-width', '1.5px');
            path.setAttribute('stroke-opacity', `${opacity}`)
            path.addDependency(this.camera, this.q);
            path.update = () => {

                let lastVisible = false;
                let d = '';
                for (let j = 0; j < longs[i].length; j++) {

                    let point = longs[i][j].copy();
                    let t = point.apply(this.q).scale(r);

                    let v = this.camera.projectPoint(t);
                    let u = this.coordinateSystem.plot.viewportToFrame(v);

                    if (v.z === 1) {

                        if (lastVisible) {
                            d += `L ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                        } else {
                            d += `M ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                            lastVisible = true;
                        }
                    } else {
                        lastVisible = false;
                    }
                }

                path.d = d;
            }
            path.update();
            this.background.appendChild(path)
        }

        let lats = CoordinateSystem3D.generateHorizontalSlices(horizontalN, s, identity);


        for (let i = 0; i < lats.length; i++) {
            let path = this.coordinateSystem.plot.frame.path();
            path.setAttribute('stroke', 'var(--medium)')
            path.setAttribute('stroke-width', '1.5px')
            path.setAttribute('stroke-opacity', `${opacity}`)
            path.addDependency(this.camera, this.q);

            path.update = () => {

                let d = '';
                let lastVisible = false;

                for (let j = 0; j < lats[i].length; j++) {

                    let point = lats[i][j].copy();
                    let t = point.apply(this.q).scale(r);

                    let v = this.camera.projectPoint(t);
                    let u = this.coordinateSystem.plot.viewportToFrame(v);

                    if (v.z === 1) {

                        if (lastVisible) {
                            d += `L ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                        } else {
                            d += `M ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                            lastVisible = true;
                        }
                    } else {
                        lastVisible = false;
                    }
                }

                path.d = d;
            }

            path.update();
            this.background.appendChild(path)

        }

    }

    newPath(): Path {
        return this.background.path();
    }

    drawPath(points: Vector3[], config: { stroke?: string, opacity?: number } = {}) {

        let defaultConfig = {
            stroke: 'var(--font-color)',
            opacity: 0.75
        }

        config = { ...defaultConfig, ...config };

        let path = this.background.path();
        path.setAttribute('stroke', config.stroke);
        path.setAttribute('stroke-width', '1.5px');
        path.setAttribute('stroke-opacity', `${config.opacity}`)
        path.addDependency(this.camera, this.camera.orientation, this.camera.position, this.q);
        path.update = () => {

            let clip = 0;
            let pathStarted = false;
            let d = '';

            for (let j = 0; j < points.length; j++) {

                let point = points[j];
                let t = this.q.transform(point);

                let v = this.camera.projectPoint(t);

                let u = this.coordinateSystem.plot.viewportToFrame(v);

                if (pathStarted) {
                    d += `L ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                } else {
                    d += `M ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                    pathStarted = true; // Start the path
                }
            }
            path.d = d + 'Z';
        }
        path.update();

        return path;

    }

    drawPathNoQ(points: Vector3[], config: { stroke?: string, opacity?: number } = {}) {

        let defaultConfig = {
            stroke: 'var(--font-color)',
            opacity: 0.75
        }

        config = { ...defaultConfig, ...config };

        let path = this.background.path();
        path.setAttribute('stroke', config.stroke);
        path.setAttribute('stroke-width', '1.5px');
        path.setAttribute('stroke-opacity', `${config.opacity}`)
        path.addDependency(this.camera, this.camera.orientation, this.camera.position);
        path.update = () => {

            let clip = 0;
            let pathStarted = false;
            let d = '';

            for (let j = 0; j < points.length; j++) {



                let v = points[j];
                let t = this.camera.projectPoint(v);
                let u = this.coordinateSystem.plot.viewportToFrame(t);

                if (pathStarted) {
                    d += `L ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                } else {
                    d += `M ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                    pathStarted = true; // Start the path
                }
            }
            path.d = d + 'Z';
        }
        path.update();

        return path;

    }

    drawQuaternionPath(curve: (t: number) => Vector3, numPoint = 20) {

        let path = this.newPath();
        path.setAttribute('stroke', 'var(--medium)');
        path.setAttribute('stroke-width', '1.5px');
        path.setAttribute('stroke-opacity', '0.5');
        path.addDependency(this.q, this.camera);

        path.update = () => {
            let hasStarted = false;
            let d = '';
            for (let i = 0; i <= numPoint; i++) {

                let h = curve(i / numPoint);

                let v = this.camera.projectPoint(h.apply(this.q));
                let u = this.coordinateSystem.plot.viewportToFrame(v);


                d += `${hasStarted ? 'L' : 'M'} ${u.x.toFixed(3)} ${u.y.toFixed(3)} `;
                hasStarted = true;
            }
            path.d = d;
        }
        path.update();
    }

    createLine(p0: Vector3, p1: Vector3): (t: number) => Vector3 {
        return function (t: number): Vector3 {
            return new Vector3(
                (1 - t) * p0.x + t * p1.x,
                (1 - t) * p0.y + t * p1.y,
                (1 - t) * p0.z + t * p1.z
            );
        };
    }

    createCatmullRomSpline(start: Vector3, through: Vector3, end: Vector3): (t: number) => Vector3 {

        const p0 = { x: 2 * start.x - through.x, y: 2 * start.y - through.y, z: 2 * start.z - through.z };
        const p1 = start;  // Start point
        const p2 = through;  // Through point, also control point
        const p3 = end;    // End point
        const p4 = { x: 2 * end.x - through.x, y: 2 * end.y - through.y, z: 2 * end.z - through.z };

        // Return the function to calculate a point on the spline
        return function (t: number): Vector3 {
            // Scale and shift t to the appropriate range
            let localT, f0, f1, f2, f3;
            if (t < 0.5) {
                // Scale t to [0, 1] for the first segment
                localT = t * 2;
                f0 = -0.5 * localT ** 3 + localT ** 2 - 0.5 * localT;
                f1 = 1.5 * localT ** 3 - 2.5 * localT ** 2 + 1.0;
                f2 = -1.5 * localT ** 3 + 2.0 * localT ** 2 + 0.5 * localT;
                f3 = 0.5 * localT ** 3 - 0.5 * localT ** 2;
                return new Vector3(
                    f0 * p0.x + f1 * p1.x + f2 * p2.x + f3 * p3.x,
                    f0 * p0.y + f1 * p1.y + f2 * p2.y + f3 * p3.y,
                    f0 * p0.z + f1 * p1.z + f2 * p2.z + f3 * p3.z
                );
            } else {
                // Shift and scale t to [0, 1] for the second segment
                localT = (t - 0.5) * 2;
                f0 = -0.5 * localT ** 3 + localT ** 2 - 0.5 * localT;
                f1 = 1.5 * localT ** 3 - 2.5 * localT ** 2 + 1.0;
                f2 = -1.5 * localT ** 3 + 2.0 * localT ** 2 + 0.5 * localT;
                f3 = 0.5 * localT ** 3 - 0.5 * localT ** 2;
                return new Vector3(
                    f0 * p1.x + f1 * p2.x + f2 * p3.x + f3 * p4.x,
                    f0 * p1.y + f1 * p2.y + f2 * p3.y + f3 * p4.y,
                    f0 * p1.z + f1 * p2.z + f2 * p3.z + f3 * p4.z
                );
            }
        };
    }

    createHermiteCurve(start: Vector3, through: Vector3, end: Vector3): (t: number) => Vector3 {

        // Calculate tangents as direction vectors scaled for influence
        // Typically, these would be based on some more complex logic
        const tangentScale = 0.5;  // Control the influence of the tangent
        const control1 = {
            x: (through.x - start.x) * tangentScale,
            y: (through.y - start.y) * tangentScale,
            z: (through.z - start.z) * tangentScale,
        };
        const control2 = {
            x: (end.x - through.x) * tangentScale,
            y: (end.y - through.y) * tangentScale,
            z: (end.z - through.z) * tangentScale,
        };

        // Hermite curve function
        return function (t: number): Vector3 {
            // Ensure t is within the valid range of 0 to 1
            t = Math.max(0, Math.min(1, t));
            const t3 = t * t * t;
            const t2 = t * t;
            const f1 = 2 * t3 - 3 * t2 + 1;   // calculate basis function 1
            const f2 = -2 * t3 + 3 * t2;      // calculate basis function 2
            const f3 = t3 - 2 * t2 + t;       // calculate basis function 3
            const f4 = t3 - t2;               // calculate basis function 4

            return new Vector3(
                f1 * start.x + f2 * end.x + f3 * control1.x + f4 * control2.x,
                f1 * start.y + f2 * end.y + f3 * control1.y + f4 * control2.y,
                f1 * start.z + f2 * end.z + f3 * control1.z + f4 * control2.z
            );
        };
    }

    createSplineCurve(start: Vector3, control: Vector3, end: Vector3): (t: number) => Vector3 {

        // Calculate the shadow control point as the mirror of the control point across the end point
        const shadowControl = new Vector3(
            2 * end.x - control.x,
            2 * end.y - control.y,
            2 * end.z - control.z
        );

        // Returns a function that computes a point on the cubic Bézier curve for a given t
        return function (t: number): Vector3 {
            // Ensure t is between 0 and 1
            t = Math.max(0, Math.min(1, t));

            // Calculate the point on the curve using the cubic Bézier formula
            const u = 1 - t;
            const tt = t * t;
            const uu = u * u;
            const uuu = uu * u;
            const ttt = tt * t;

            // Compute the point on the curve
            return new Vector3(
                uuu * start.x + 3 * uu * t * control.x + 3 * u * tt * shadowControl.x + ttt * end.x,
                uuu * start.y + 3 * uu * t * control.y + 3 * u * tt * shadowControl.y + ttt * end.y,
                uuu * start.z + 3 * uu * t * control.z + 3 * u * tt * shadowControl.z + ttt * end.z
            );
        };
    }

    createBezierCurve(p0: Vector3, p1: Vector3, p2: Vector3): (t: number) => Vector3 {
        return function (t: number): Vector3 {
            const oneMinusT = 1 - t;
            return new Vector3(
                oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
                oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y,
                oneMinusT * oneMinusT * p0.z + 2 * oneMinusT * t * p1.z + t * t * p2.z
            );
        };
    }

    sphereLabel(v: Vector3, s: string, scale: number = 1.4, fade: boolean = true): Tex {
        let t = this.coordinateSystem.tex(v, s);
        t.addDependency(v, this.normal);
        t.update = () => {
            let p = this.camera.projectPoint(v.scale(scale));
            let q = this.coordinateSystem.plot.viewportToFrame(p.x, p.y);
            t.moveTo(q);

            let dot = this.normal.dot(v.normalize());
            if (fade && dot < 0) {
                t.setAttribute('opacity', Math.max(1 + 2 * dot, 0).toFixed(2));
            } else {
                t.setAttribute('opacity', '1')
            }
        }
        t.update();

        return t;
    }

    labelBasisVectors() {
        let basisLabels = this.foreground.group();

        let si = new Vector3(1, 0, 0).scale(1.25);
        let sj = new Vector3(0, 1, 0).scale(1.25);
        let sk = new Vector3(0, 0, 1).scale(1.25);
        
        this.orientPoint(si, this.q);
        this.orientPoint(sj, this.q);
        this.orientPoint(sk, this.q);
    
        let iLabel = this.sphereLabel(si, '\\hat{\\imath}').setColor('\\hat{\\imath}','var(--red)');
        let jLabel = this.sphereLabel(sj, '\\hat{\\jmath}').setColor('\\hat{\\jmath}','var(--green)');
        let kLabel = this.sphereLabel(sk, '\\hat{k}').setColor('\\hat{k}','var(--blue)');

        iLabel.setAttribute('font-size', '20px');
        jLabel.setAttribute('font-size', '20px');
        kLabel.setAttribute('font-size', '20px');

        iLabel.drawBackground(true);
        jLabel.drawBackground(true);
        kLabel.drawBackground(true);

        basisLabels.appendChild(iLabel);
        basisLabels.appendChild(jLabel);
        basisLabels.appendChild(kLabel);

        return basisLabels;
    }

    orientPoint = (v: Vector3, q: Quaternion) => {
        let v_copy = v.copy();
        v.addDependency(q);
        v.update = () => {
            v.set(q.multiply(Quaternion.fromVector(v_copy)).multiply(q.conjugate()).toVector3())
        }
        v.update();
    }

}