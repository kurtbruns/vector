import { Camera, Group, Line, Path } from "..";
import { CoordinateSystem3D } from "./CoordinateSystem3D";
import { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";

export interface QObjectConfig {
    q?:Quaternion;
}


export class QObject {

    coordinateSystem: CoordinateSystem3D;
    camera: Camera;
    root: Group;
    foreground : Group;
    background : Group;

    normal: Vector3;
    q: Quaternion;

    constructor(coordinateSystem : CoordinateSystem3D, config: QObjectConfig = {}) {

        let defaultConfig = {
            q:new Quaternion(1, 0, 0, 0)
        }

        config = { ...defaultConfig, ...config };

        this.coordinateSystem = coordinateSystem;
        this.camera = coordinateSystem.camera;

        this.q = new Quaternion(1, 0, 0, 0);
        this.root = coordinateSystem.foreground.group();
        this.background = this.root.group();
        this.foreground = this.root.group();

        this.normal = new Vector3();
        this.normal.addDependency(this.camera.orientation);
        this.normal.update = () => {
            let v = this.camera.orientation.conjugate().transform(new Vector3(0, 0, -1));
            this.normal.set(new Vector3(v.x, v.y, -v.z));
        }
        this.normal.update();
    }


    registerEventListeners(r = 2, invert = false) {

        r = 1;
        let isDragging = false;
        let isSpaceDown = false;
        let upAxis: 'x' | 'y' | 'z' = 'z';
        let prevX: number = 0;
        let prevY: number = 0;
        let bbox = this.coordinateSystem.plot.getFrameBoundingRect();

        /**
         * Projects the coordinates onto the northern hemisphere of a sphere.
         */
        const projectOnTrackball = (touchX: number, touchY: number) => {

            let x = (invert ? 1 : -1) * (touchX - bbox.left - bbox.width / 2) / bbox.height;
            let y = (invert ? 1 : -1) * (touchY - bbox.top - bbox.height / 2) / bbox.height;
            let z = 0.0;
            let distance = x * x + y * y;
            if (distance <= r * r / 2) {
                // Inside sphere
                z = Math.sqrt(r * r - distance);

            } else {
                // On hyperbola
                z = (r * r / 2) / Math.sqrt(distance);

            }

            return new Vector3(-x, y, z).normalize();
        }

        // Mouse down handler
        const handleMouseDown = (event: MouseEvent) => {

            console.log(event.target,this.coordinateSystem.plot.frame.root )
            if (this.coordinateSystem.plot.root.root.contains(event.target as HTMLElement)) {
                isDragging = true;
                bbox = this.coordinateSystem.plot.frame.root.getBoundingClientRect();
                this.coordinateSystem.plot.setCTM();
                this.coordinateSystem.plot.setBoundingRect();
                prevX = event.clientX;
                prevY = event.clientY;
            }
        };

        // Mouse move handler
        const handleMouseMove = (event: MouseEvent) => {

            if (isDragging && (event.clientX !== prevX || event.clientY !== prevY)) {

                const v1 = projectOnTrackball(prevX, prevY);
                const v2 = projectOnTrackball(event.clientX, event.clientY);

                const q1 = Quaternion.fromVector(v1);
                const q2 = Quaternion.fromVector(v2);

                let r = q2.multiply(q1.conjugate());

                this.q.set(r.multiply(this.q));

                event.preventDefault();

            }

            prevX = event.clientX;
            prevY = event.clientY;
        };

        // Mouse up handler
        const handleMouseUp = () => {
            isDragging = false;
            this.coordinateSystem.plot.releaseBoundingRect();
            this.coordinateSystem.plot.releaseCTM();
        };

        let scaleFactor = 1.1;

        // Keydown handler
        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowUp':
                    this.camera.lookAt(this.coordinateSystem.origin, new Vector3(0, 0, -1));
                    break;
                case 'ArrowDown':
                    // Handle arrow down key
                    this.camera.lookAt(this.coordinateSystem.origin, new Vector3(0, 0, 1));
                    break;
                case 'ArrowLeft':
                    // Handle arrow left key
                    break;
                case 'ArrowRight':
                    // Handle arrow right key
                    break;
                case 'Enter':
                    console.log(this.q.toConstructor())
                    break;
                case '=':
                    this.camera.position.set(this.camera.position.scale(1 / scaleFactor));
                    // this.camera.position = this.camera.position.subtract(this.camera.position.normalize().copy());
                    this.camera.updateDependents();
                    break;
                case '-':
                    this.camera.position.set(this.camera.position.scale(scaleFactor));
                    // this.camera.position = this.camera.position.add(this.camera.position.normalize().copy());
                    this.camera.updateDependents();
                    break;
                case 'x':
                    upAxis = 'x';
                    this.camera.orientation.set(new Quaternion(1, 0, 0, 0).multiply(Quaternion.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2)));
                    this.camera.position.set(new Vector3(0, 0, -this.camera.position.length()))
                    this.camera.orientation.updateDependents();
                    this.camera.position.updateDependents();
                    this.camera.updateDependents();


                    // this.camera.lookAt(this.origin, new Vector3(-1, 0, 0));
                    event.preventDefault();
                    break;
                case 'y':
                    upAxis = 'y';
                    this.camera.orientation.set(new Quaternion(1, 0, 0, 0));
                    this.camera.position.set(new Vector3(0, 0, -this.camera.position.length()))
                    this.camera.orientation.updateDependents();
                    this.camera.position.updateDependents();
                    this.camera.updateDependents();

                    // this.camera.lookAt(this.origin, new Vector3(0, -1, 0));
                    event.preventDefault();
                    break;
                case 'z':
                    upAxis = 'z';
                    // this.camera.orientation.set(new Quaternion(0, 0, -Math.sqrt(2) / 2, Math.sqrt(2) / 2));
                    this.camera.orientation.set(new Quaternion(0, 0, -Math.sqrt(2) / 2, Math.sqrt(2) / 2).multiply(new Quaternion(0, 0, 0, 1)));
                    this.camera.position.set(new Vector3(0, -this.camera.position.length(), 0));
                    this.camera.orientation.updateDependents();
                    this.camera.position.updateDependents();
                    this.camera.updateDependents();



                    // this.camera.orientation.set(Quaternion.identity());
                    // this.camera.position.set(new Vector(this.camera.position.length()))
                    event.preventDefault();
                    break;
                case ' ':
                    // Handle space bar
                    isSpaceDown = true;
                    event.preventDefault();
                    break;
                default:
                    // Handle other keys if necessary
                    break;
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowUp':
                    break;
                case 'ArrowDown':
                    break;
                case 'ArrowLeft':
                    // Handle arrow left key
                    break;
                case 'ArrowRight':
                    // Handle arrow right key
                    break;
                case 'Enter':
                    break;
                case ' ':
                    // Handle space bar
                    isSpaceDown = false;
                    // switch (upAxis) {
                    //     case 'x':
                    //         upAxis = 'x';
                    //         this.camera.lookAt(this.origin, new Vector3(-1, 0, 0));
                    //         break;
                    //     case 'y':
                    //         upAxis = 'y';
                    //         this.camera.lookAt(this.origin, new Vector3(0, -1, 0));
                    //         break;
                    //     case 'z':
                    //         upAxis = 'z';
                    //         this.camera.lookAt(this.origin, new Vector3(0, 0, -1));
                    //         break;
                    // }
                    // event.preventDefault();
                    break;
                default:
                    // Handle other keys if necessary
                    break;
            }
        };

        // Attach event listeners
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

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


    orientPoint = (v: Vector3, q: Quaternion) => {
        let v_copy = v.copy();
        v.addDependency(q);
        v.update = () => {
            v.set(q.multiply(Quaternion.fromVector(v_copy)).multiply(q.conjugate()).toVector3())
        }
        v.update();
    }


}