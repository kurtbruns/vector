import { Camera } from "./Camera";
import { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";
import { Vector2 } from "./Vector2";
import { AnimationFunction, BaseNode, CoordinateSystem, Group, Point, TeX } from "..";

export interface Scene3DConfig {
    width?: number;
    height?: number;
    gridWidth?: number;
    gridHeight?: number;
    cameraPosition?: Vector3;
    cameraOrientation?: Quaternion;
    groundGrid?: boolean;
    drawCube?: boolean;
    // pitch?: number;
    // yaw?: number;
    drawAxes?: boolean;
    drawAxesArrows?: boolean;
    labelAxes?: boolean;
    labelAxesColor?: boolean;
    axesColor?: string;
    tickMarks?: boolean;
    tickMarksColor?: boolean;
    tickMarksColorAlt?: boolean;
    size?: number;
    distance?: number;
    controls?: boolean;
    root?: HTMLElement;
    suffix?: string;
}

export class Scene3D {

    origin: Vector3;
    positiveX: Vector3;
    positiveY: Vector3;
    positiveZ: Vector3;
    negativeX: Vector3;
    negativeY: Vector3;
    negativeZ: Vector3;

    viewPort: CoordinateSystem;
    cameraDistance: number;
    camera: Camera;

    foreground: Group;

    constructor(config: Scene3DConfig = {}) {

        let defaultConfig = {

            cameraOrientation: new Quaternion(0.424, 0.227, -0.414, 0.773),
            cameraPosition: new Vector3(12.644, -8.047, 9.969),

            // // 16x9
            // gridWidth: 0.096,
            // gridHeight: 0.054,

            // // 1x1
            // gridWidth: 0.064,
            // gridHeight: 0.064,

            width: 540,
            height: 540,

            // 4x3
            gridWidth: 0.048,
            gridHeight: 0.048,
            distance: 15,
            drawAxes: true,
            drawAxesArrows: true,
            labelAxes: true,
            labelAxesColor: false,
            axesColor: 'var(--font-color-light)',
            tickMarks: true,
            tickMarksColor: false,
            tickMarksColorAlt: false,
            size: 5,
            pitch: 43,
            yaw: 32,

            groundGrid: true,
            controls: true
        }

        config = { ...defaultConfig, ...config };

        this.viewPort = new CoordinateSystem({

            root: config.root,

            // width: 640,
            // height: 640,

            // id: this.constructor.name + (config.suffix ? config.suffix : ''),

            width: config.width,
            height: config.height,

            gridWidth: config.gridWidth,
            gridHeight: config.gridHeight,
            drawGrid: false,
            axesArrows: false,
            axesLabels: false,
            // axesColor: 'var(--faint-primary)',
            axesColor: 'none',
            big: true,
        })

        // this.viewPort.frame.root.style.overflow = 'visible';

        this.viewPort.frame.root.style.outline = `1.5px solid var(--border-color)`;
        // this.viewPort.frame.root.style.boxShadow = `4px 4px 8px rgba(255, 255, 255, 0.5), -4px -4px 8px rgba(0, 0, 0, 0.2);`;

        // TODO: does not actually draw in the foreground?
        this.foreground = this.viewPort.frame.group();

        this.origin = new Vector3(0, 0, 0);
        this.positiveX = new Vector3(1, 0, 0);
        this.positiveY = new Vector3(0, 1, 0);
        this.positiveZ = new Vector3(0, 0, 1);
        this.negativeX = new Vector3(-1, 0, 0);
        this.negativeY = new Vector3(0, -1, 0);
        this.negativeZ = new Vector3(0, 0, -1);

        this.cameraDistance = config.distance;

        let fov = 60; // Field of view in degrees
        let aspectRatio = config.gridWidth / config.gridHeight;
        let nearPlane = 0.1;
        let farPlane = 1000;
        let distance = config.distance;

        let position = new Vector3(0, -0.0001, this.cameraDistance);

        if (config.cameraPosition) {
            position = config.cameraPosition;
        }

        let orientation = Quaternion.orientationBetween(position, this.origin);

        this.camera = new Camera(position, orientation, fov, aspectRatio, nearPlane, farPlane);
        this.camera.lookAt(this.origin, new Vector3(0, 0, -1));
        if (config.cameraOrientation) {
            this.camera.orientation = config.cameraOrientation;
        }

        this.registerEventListeners(distance);

        // this.drawDots(3);

        if (config.groundGrid) {
            this.drawGroundGrid(config.size);
        }

        if (config.drawCube) {
            this.drawCube(config.size, false);
        }

        if (config.drawAxes) {
            this.drawAxes(config.size, { color: config.axesColor, arrows: config.drawAxesArrows });
        }

        if (config.labelAxes) {
            this.labelAxes(config.size, { color: config.labelAxesColor });
        }

        if (config.tickMarks) {
            if (config.tickMarksColorAlt) {
                this.drawTickMarksColor(config.size - (config.drawAxesArrows ? 1 : 0));

            } else if (config.tickMarksColor) {
                this.drawTickMarks(config.size - (config.drawAxesArrows ? 1 : 0));
            } else {
                this.drawTickMarksGrey(config.size - (config.drawAxesArrows ? 1 : 0));
            }
        }


    }

    set reset(lambda: () => void) {
        this.viewPort.reset = lambda;
    }

    wait(duration?: number) {
        this.viewPort.wait(duration);
    }

    play(animations: AnimationFunction[], duration: number = 1, type: "easeInOut" | "linear" = "easeInOut") {
        this.viewPort.play(animations, duration, type);
    }

    registerEventListeners(d: number) {

        let isDragging = false;
        let isSpaceDown = false;
        let upAxis: 'x' | 'y' | 'z' = 'z';
        let prevX: number = 0;
        let prevY: number = 0;
        const bbox = this.viewPort.frame.root.getBoundingClientRect();

        /**
         * Projects the coordinates onto the northern hemisphere of a sphere.
         */
        const projectOnTrackball = (touchX: number, touchY: number) => {

            let r = 1;
            // let x = touchX / window.innerWidth * 2 - 1;
            // let y = -(touchY / window.innerHeight * 2 - 1);
            let x = (touchX - bbox.left - bbox.width / 2) / bbox.height;
            let y = -(touchY - bbox.top - bbox.height / 2) / bbox.height;
            let z = 0.0;
            let distance = x * x + y * y;
            if (distance <= r * r / 2) {
                // Inside sphere
                z = Math.sqrt(r * r - distance);

            } else {
                // On hyperbola
                z = (r * r / 2) / Math.sqrt(distance);
            }

            return new Vector3(x, y, z).normalize();
        }

        // Mouse down handler
        const handleMouseDown = (event: MouseEvent) => {
            if (this.viewPort.frame.root.contains(event.target as HTMLElement)) {
                isDragging = true;
                this.viewPort.plot.setCTM();
                this.viewPort.plot.setBoundingRect();
                prevX = event.clientX;
                prevY = event.clientY;
            }
        };


        // Mouse move handler
        const handleMouseMove = (event: MouseEvent) => {

            if (isSpaceDown && isDragging && (event.clientX !== prevX || event.clientY !== prevY)) {

                const v1 = projectOnTrackball(prevX, prevY);
                const v2 = projectOnTrackball(event.clientX, event.clientY);

                const q1 = Quaternion.fromVector(v1);
                const q2 = Quaternion.fromVector(v2);

                let r = q2.multiply(q1.conjugate());

                // Convert the global rotation to a local rotation
                let localRotation = this.camera.orientation.conjugate().multiply(r).multiply(this.camera.orientation).normalize();

                // Apply the local rotation to the camera's orientation
                this.camera.position.applyQuaternion(localRotation);

                this.camera.orientation = this.camera.orientation.multiply(localRotation.inverse());


            } else if (isDragging && (event.clientX !== prevX || event.clientY !== prevY)) {

                let up_vec;
                let right_vec: Vector3;

                if (upAxis === 'x') {

                    up_vec = new Vector3(0, 0, 1);
                    right_vec = new Vector3(0, 1, 0);

                    let q = this.camera.orientation.conjugate();
                    let c = q.conjugate();
                    let up = q.multiply(Quaternion.fromVector(up_vec)).multiply(c);
                    let forward = q.multiply(Quaternion.fromVector(right_vec)).multiply(c);

                    let scalar = 200;
                    let r = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), -(event.clientX - prevX) / scalar);
                    let s = Quaternion.fromAxisAngle(up.toVector3().cross(forward.toVector3()).normalize(), -(event.clientY - prevY) / scalar);

                    let u = r.multiply(s).normalize();

                    this.camera.position.applyQuaternion(u);
                    this.camera.orientation = this.camera.orientation.multiply(u.inverse()).normalize();

                } else {
                    switch (upAxis) {
                        case 'y':
                            up_vec = new Vector3(0, 1, 0);
                            right_vec = new Vector3(0, 0, -1);
                            break;
                        default:
                            up_vec = new Vector3(0, 0, 1);
                            right_vec = new Vector3(0, 1, 0);
                            break;
                    }


                    let q = this.camera.orientation.conjugate();
                    let c = q.conjugate();
                    let up = q.multiply(Quaternion.fromVector(up_vec)).multiply(c);
                    let forward = q.multiply(Quaternion.fromVector(right_vec)).multiply(c);

                    let scalar = 200;
                    let r = Quaternion.fromAxisAngle(up.toVector3().cross(forward.toVector3()).normalize(), -(event.clientY - prevY) / scalar);
                    // let r = Quaternion.fromAxisAngle(forward.toVector3().cross(up.toVector3()).normalize(), (event.clientY - prevY)/scalar);
                    let s = Quaternion.fromAxisAngle(up_vec, -(event.clientX - prevX) / scalar);

                    let u = s.multiply(r).normalize();

                    this.camera.position.applyQuaternion(u);
                    this.camera.orientation = this.camera.orientation.multiply(u.inverse()).normalize();
                }

            }

            prevX = event.clientX;
            prevY = event.clientY;
        };

        // Mouse up handler
        const handleMouseUp = () => {
            isDragging = false;
            this.viewPort.plot.releaseBoundingRect();
            this.viewPort.plot.releaseCTM();
        };

        // Keydown handler
        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowUp':
                    this.camera.lookAt(this.origin, new Vector3(0, 0, -1));
                    break;
                case 'ArrowDown':
                    // Handle arrow down key
                    this.camera.lookAt(this.origin, new Vector3(0, 0, 1));
                    break;
                case 'ArrowLeft':
                    // Handle arrow left key
                    break;
                case 'ArrowRight':
                    // Handle arrow right key
                    break;
                case 'Enter':
                    console.log(`cameraOrientation: ${this.camera.orientation.toConstructor((n) => n.toFixed(3))}, \n        cameraPosition: ${this.camera.position.toConstructor((n) => n.toFixed(3))},`);
                    break;
                case '=':
                    this.camera.position = this.camera.position.subtract(this.camera.position.normalize().copy());
                    this.camera.updateDependents();
                    break;
                case '-':
                    this.camera.position = this.camera.position.add(this.camera.position.normalize().copy());
                    this.camera.updateDependents();
                    break;
                case 'x':
                    upAxis = 'x';
                    this.camera.lookAt(this.origin, new Vector3(-1, 0, 0));
                    event.preventDefault();
                    break;
                case 'y':
                    upAxis = 'y';
                    this.camera.lookAt(this.origin, new Vector3(0, -1, 0));
                    event.preventDefault();
                    break;
                case 'z':
                    upAxis = 'z';
                    this.camera.lookAt(this.origin, new Vector3(0, 0, -1));
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

    drawComponents(v: Vector3) {
        let i = new Vector3();
        i.addDependency(v);
        i.update = () => {
            i.x = v.x;
        };

        let j = new Vector3();
        j.addDependency(v);
        j.update = () => {
            j.y = v.y;
        };

        let k = new Vector3();
        k.addDependency(v);
        k.update = () => {
            k.z = v.z;
        };

        // this.vector(this.origin, i, 'var(--red)');
        // this.vector(this.origin, j, 'var(--green)');
        // this.vector(this.origin, k, 'var(--blue)');

        let vi = new Vector3();
        vi.addDependency(v, i);
        vi.update = () => {
            let temp = v.subtract(i);
            vi.x = temp.x;
            vi.y = temp.y;
            vi.z = temp.z;
        };
        this.line(vi, v, 'var(--green)');

        let vj = new Vector3();
        vj.addDependency(v, j);
        vj.update = () => {
            let temp = v.subtract(j);
            vj.x = temp.x;
            vj.y = temp.y;
            vj.z = temp.z;
        };
        this.line(vj, v, 'var(--red)');

        let vz = new Vector3();
        vz.addDependency(v, k);
        vz.update = () => {
            let temp = v.subtract(k);
            vz.x = temp.x;
            vz.y = temp.y;
            vz.z = temp.z;
        };
        this.line(vz, v, 'var(--blue)');
    }

    static convertSphericalToCartesian(latitude: number, longitude: number): Vector3 {
        // Assuming radius is 1
        let x = Math.cos(latitude) * Math.cos(longitude);
        let y = Math.cos(latitude) * Math.sin(longitude);
        let z = Math.sin(latitude);

        return new Vector3(x, y, z)
    }

    static generateSphereLongitudeSlices(lats: number, longs: number): Vector3[][] {
        let points: Vector3[][] = [];

        for (let longIndex = 0; longIndex < longs; longIndex++) {

            let slice: Vector3[] = [];

            let long = (2 * Math.PI * longIndex / longs);

            for (let latIndex = 0; latIndex <= lats; latIndex++) {
                // Compute the latitude angle, ranging from -90 to 90 degrees
                let lat = (Math.PI / 2) - (Math.PI * latIndex / lats);
                slice.push(Scene3D.convertSphericalToCartesian(lat, long));

            }

            points.push(slice);
        }

        return points;
    }

    static generateSphereLatitudeSlices(lats: number, longs: number): Vector3[][] {
        let points: Vector3[][] = [];

        for (let latIndex = 0; latIndex <= lats; latIndex++) {
            let slice: Vector3[] = [];

            // Compute the latitude angle, ranging from -90 to 90 degrees
            let lat = (Math.PI / 2) - (Math.PI * latIndex / lats);

            // For each latitude, iterate over longitude
            for (let longIndex = 0; longIndex <= longs; longIndex++) {
                // Compute the longitude angle, ranging from 0 to 360 degrees
                let long = (2 * Math.PI * longIndex / longs);

                // Add point to slice. No need to exclude poles here as we're iterating over longitude
                slice.push(Scene3D.convertSphericalToCartesian(lat, long));
            }

            // Add the slice to the points array
            points.push(slice);
        }

        return points;
    }


    static generateSpherePoints(lats: number, longs: number): Vector3[] {
        let points: Vector3[] = [];

        // for (let i = n - 1; i >= 0; i--) {
        for (let i = 0; i <= longs; i++) {
            // Compute the latitude angle, ranging from -90 to 90 degrees
            let lat = (Math.PI / 2) - (Math.PI * i / longs);

            // Exclude poles, as they don't have multiple points
            if (i === 0 || i === longs) {
                points.push(Scene3D.convertSphericalToCartesian(lat, 0));
                continue;
            }

            for (let longIndex = 0; longIndex < lats; longIndex++) {
                // Compute the longitude angle, ranging from 0 to 360 degrees
                let long = (2 * Math.PI * longIndex / lats);
                points.push(Scene3D.convertSphericalToCartesian(lat, long));
            }
        }

        return points;
    }

    static generateSpherePointsEuler(radius: number, count: number, center: Vector3 = new Vector3()) {

        const points: Vector3[] = [];
        const offset = 2 / count;
        const increment = Math.PI * (3 - Math.sqrt(5));

        for (let i = 0; i < count; i++) {
            const y = ((i * offset) - 1) + (offset / 2);
            const r = Math.sqrt(1 - y * y);
            const phi = ((i + 1) % count) * increment; // Ensuring last and first points are not the same
            const x = Math.cos(phi) * r;
            const z = Math.sin(phi) * r;

            points.push(new Vector3(x, y, z).normalize().scale(radius).add(center));
        }

        return points;
    }

    drawSphere(radius: number, count: number, center: Vector3 = new Vector3()) {

        const points: Vector3[] = [];
        const offset = 2 / count;
        const increment = Math.PI * (3 - Math.sqrt(5));

        for (let i = 0; i < count; i++) {
            const y = ((i * offset) - 1) + (offset / 2);
            const r = Math.sqrt(1 - y * y);
            const phi = ((i + 1) % count) * increment; // Ensuring last and first points are not the same
            const x = Math.cos(phi) * r;
            const z = Math.sin(phi) * r;

            points.push(new Vector3(x, y, z).normalize().scale(radius).add(center));
        }

        for (let i = 0; i < points.length; i++) {
            this.drawPoint(points[i], { color: 'var(--main)', opacity: 0.25 });
        }

        // let N = 100;
        // let start = this.viewPort.plot.SVGToRelative(1, 0);
        // let path = this.viewPort.frame.path(`M ${start.x} ${start.y}`);
        // for (let n = 1; n < N; n++) {
        //     let a = (n/N)*2*Math.PI;
        //     let x = Math.cos(a);
        //     let y = Math.sin(a);
        //     let t = this.viewPort.plot.SVGToRelative(x, y);
        //     path.d += `L ${t.x} ${t.y} `

        // }
    }



    drawDots(x: number = 5) {
        for (let i = -x; i <= x; i++) {
            for (let j = -x; j <= x; j++) {
                for (let k = -x; k <= x; k++) {
                    this.drawPoint(new Vector3(i, j, k), { color: 'var(--muted-primary)' });
                }
            }
        }
    }

    drawGroundGrid(c: number = 5, color: string = 'var(--font-color)', opacity: number = 0.2) {

        for (let j = -c; j <= c; j++) {
            this.line(new Vector3(-c, j, 0), new Vector3(c, j, 0), color, opacity);
        }

        for (let i = -c; i <= c; i++) {
            this.line(new Vector3(i, -c, 0), new Vector3(i, c, 0), color, opacity);
        }
    }

    labelAxes(c: number = 5, options: { color?: boolean, a?: number } = {}): Group {

        let defaultOptions = {
            a: 0.5,
            color: false,
        };

        options = { ...defaultOptions, ...options };

        let x = this.tex(this.positiveX.scale(c + options.a), 'x')
        let y = this.tex(this.positiveY.scale(c + options.a), 'y')
        let z = this.tex(this.positiveZ.scale(c + options.a), 'z')

        if (options.color) {
            x.setColorAll('x', 'var(--green)');
            y.setColorAll('y', 'var(--red)');
            z.setColorAll('z', 'var(--blue)');
        }

        let group = this.foreground.group();
        group.appendChild(x);
        group.appendChild(y);
        group.appendChild(z);
        return group;

    }

    drawTickMarks(c: number = 5, a: number = 0.15, opacity = 0.4) {

        for (let d = 1; d <= c; d++) {

            // Positive z Direction
            this.line(new Vector3(a, 0, d), new Vector3(-a, 0, d), 'var(--blue)', opacity);
            this.line(new Vector3(0, a, d), new Vector3(0, -a, d), 'var(--blue)', opacity);

            // Negative z Direction
            this.line(new Vector3(a, 0, -d), new Vector3(-a, 0, -d), `var(--blue)`, opacity);
            this.line(new Vector3(0, a, -d), new Vector3(0, -a, -d), 'var(--blue)', opacity);

            // Positive x Direction
            this.line(new Vector3(d, a, 0), new Vector3(d, -a, 0), 'var(--green)', opacity);
            this.line(new Vector3(d, 0, a), new Vector3(d, 0, -a), 'var(--green)', opacity);

            // Negative x Direction
            this.line(new Vector3(-d, a, 0), new Vector3(-d, -a, 0), 'var(--green)', opacity);
            this.line(new Vector3(-d, 0, a), new Vector3(-d, 0, -a), 'var(--green)', opacity);

            // Positive y Direction
            this.line(new Vector3(a, d, 0), new Vector3(-a, d, 0), 'var(--red)', opacity);
            this.line(new Vector3(0, d, a), new Vector3(0, d, -a), 'var(--red)', opacity);

            // Negative y Direction
            this.line(new Vector3(a, -d, 0), new Vector3(-a, -d, 0), 'var(--red)', opacity);
            this.line(new Vector3(0, -d, a), new Vector3(0, -d, -a), 'var(--red)', opacity);
        }
    }

    drawTickMarksGrey(c: number = 5, a: number = 0.15, opacity = 1) {

        for (let d = 1; d <= c; d++) {

            // Positive z Direction
            this.line(new Vector3(a, 0, d), new Vector3(-a, 0, d), 'var(--font-color)', opacity);
            this.line(new Vector3(0, a, d), new Vector3(0, -a, d), 'var(--font-color)', opacity);

            // Negative z Direction
            this.line(new Vector3(a, 0, -d), new Vector3(-a, 0, -d), `var(--font-color)`, opacity);
            this.line(new Vector3(0, a, -d), new Vector3(0, -a, -d), 'var(--font-color)', opacity);

            // Positive x Direction
            this.line(new Vector3(d, a, 0), new Vector3(d, -a, 0), 'var(--font-color)', opacity);
            this.line(new Vector3(d, 0, a), new Vector3(d, 0, -a), 'var(--font-color)', opacity);

            // Negative x Direction
            this.line(new Vector3(-d, a, 0), new Vector3(-d, -a, 0), 'var(--font-color)', opacity);
            this.line(new Vector3(-d, 0, a), new Vector3(-d, 0, -a), 'var(--font-color)', opacity);

            // Positive y Direction
            this.line(new Vector3(a, d, 0), new Vector3(-a, d, 0), 'var(--font-color)', opacity);
            this.line(new Vector3(0, d, a), new Vector3(0, d, -a), 'var(--font-color)', opacity);

            // Negative y Direction
            this.line(new Vector3(a, -d, 0), new Vector3(-a, -d, 0), 'var(--font-color)', opacity);
            this.line(new Vector3(0, -d, a), new Vector3(0, -d, -a), 'var(--font-color)', opacity);
        }
    }

    drawTickMarksColor(c: number = 5, a: number = 0.15, opacity = 1) {

        for (let d = 1; d <= c; d++) {

            // Positive z Direction
            this.line(new Vector3(a, 0, d), new Vector3(-a, 0, d), 'var(--blue)', opacity);
            this.line(new Vector3(0, a, d), new Vector3(0, -a, d), 'var(--blue)', opacity);

            // Negative z Direction
            this.line(new Vector3(a, 0, -d), new Vector3(-a, 0, -d), 'var(--orange)', opacity);
            this.line(new Vector3(0, a, -d), new Vector3(0, -a, -d), 'var(--orange)', opacity);

            // Positive x Direction
            this.line(new Vector3(d, a, 0), new Vector3(d, -a, 0), 'var(--green)', opacity);
            this.line(new Vector3(d, 0, a), new Vector3(d, 0, -a), 'var(--green)', opacity);

            // Negative x Direction
            this.line(new Vector3(-d, a, 0), new Vector3(-d, -a, 0), 'var(--purple)', opacity);
            this.line(new Vector3(-d, 0, a), new Vector3(-d, 0, -a), 'var(--purple)', opacity);

            // Positive y Direction
            this.line(new Vector3(a, d, 0), new Vector3(-a, d, 0), 'var(--red)', opacity);
            this.line(new Vector3(0, d, a), new Vector3(0, d, -a), 'var(--red)', opacity);

            // Negative y Direction
            this.line(new Vector3(a, -d, 0), new Vector3(-a, -d, 0), 'var(--cyan)', opacity);
            this.line(new Vector3(0, -d, a), new Vector3(0, -d, -a), 'var(--cyan)', opacity);
        }
    }

    drawDirectionDots() {

        let a = 0.2;
        let d = 3;

        // Positive Z Direction
        this.drawPoint(new Vector3(a, 0, d), { color: 'var(--blue)' });
        this.drawPoint(new Vector3(0, a, d), { color: 'var(--blue)' });
        this.drawPoint(new Vector3(-a, 0, d), { color: 'var(--blue)' });
        this.drawPoint(new Vector3(0, -a, d), { color: 'var(--blue)' });

        // Negative Z Direction
        this.drawPoint(new Vector3(a, 0, -d), { color: 'var(--yellow)' });
        this.drawPoint(new Vector3(0, a, -d), { color: 'var(--yellow)' });
        this.drawPoint(new Vector3(-a, 0, -d), { color: 'var(--yellow)' });
        this.drawPoint(new Vector3(0, -a, -d), { color: 'var(--yellow)' });

        // Positive X Direction
        this.drawPoint(new Vector3(d, a, 0), { color: 'var(--green)' });
        this.drawPoint(new Vector3(d, 0, a), { color: 'var(--green)' });
        this.drawPoint(new Vector3(d, -a, 0), { color: 'var(--green)' });
        this.drawPoint(new Vector3(d, 0, -a), { color: 'var(--green)' });

        // Negative X Direction
        this.drawPoint(new Vector3(-d, a, 0), { color: 'var(--purple)' });
        this.drawPoint(new Vector3(-d, 0, a), { color: 'var(--purple)' });
        this.drawPoint(new Vector3(-d, -a, 0), { color: 'var(--purple)' });
        this.drawPoint(new Vector3(-d, 0, -a), { color: 'var(--purple)' });

        // Positive Y Direction
        this.drawPoint(new Vector3(a, d, 0), { color: 'var(--red)' });
        this.drawPoint(new Vector3(0, d, a), { color: 'var(--red)' });
        this.drawPoint(new Vector3(-a, d, 0), { color: 'var(--red)' });
        this.drawPoint(new Vector3(0, d, -a), { color: 'var(--red)' });

        // Negative Y Direction
        this.drawPoint(new Vector3(a, -d, 0), { color: 'var(--font-color)' });
        this.drawPoint(new Vector3(0, -d, a), { color: 'var(--font-color)' });
        this.drawPoint(new Vector3(-a, -d, 0), { color: 'var(--font-color)' });
        this.drawPoint(new Vector3(0, -d, -a), { color: 'var(--font-color)' });

    }

    drawCube(c: number = 5, points: boolean = true) {
        let t1 = new Vector3(-c, -c, c);
        let t2 = new Vector3(c, -c, c);
        let t3 = new Vector3(c, c, c);
        let t4 = new Vector3(-c, c, c);

        if (points) {
            this.drawPoint(t1, { color: 'var(--muted-primary)' });
            this.drawPoint(t2, { color: 'var(--muted-primary)' });
            this.drawPoint(t3, { color: 'var(--muted-primary)' });
            this.drawPoint(t4, { color: 'var(--muted-primary)' });
        }


        this.line(t1, t2, 'var(--muted-primary)');
        this.line(t2, t3, 'var(--muted-primary)');
        this.line(t3, t4, 'var(--muted-primary)');
        this.line(t4, t1, 'var(--muted-primary)');

        // middle
        // this.drawPoint(new Vector3(-2, -2, 0), '#404040');
        // this.drawPoint(new Vector3(2, -2, 0), '#404040');
        // this.drawPoint(new Vector3(2, 2, 0), '#404040');
        // this.drawPoint(new Vector3(-2, 2, 0), '#404040');

        // bottom

        let b1 = new Vector3(-c, -c, -c);
        let b2 = new Vector3(c, -c, -c);
        let b3 = new Vector3(c, c, -c);
        let b4 = new Vector3(-c, c, -c);

        if (points) {
            this.drawPoint(b1, { color: 'var(--muted-primary)' });
            this.drawPoint(b2, { color: 'var(--muted-primary)' });
            this.drawPoint(b3, { color: 'var(--muted-primary)' });
            this.drawPoint(b4, { color: 'var(--muted-primary)' });
        }

        this.line(b1, b2, 'var(--muted-primary)');
        this.line(b2, b3, 'var(--muted-primary)');
        this.line(b3, b4, 'var(--muted-primary)');
        this.line(b4, b1, 'var(--muted-primary)');

        this.line(t1, b1, 'var(--muted-primary)');
        this.line(t2, b2, 'var(--muted-primary)');
        this.line(t3, b3, 'var(--muted-primary)');
        this.line(t4, b4, 'var(--muted-primary)');
    }

    project(u: Vector3, p: Vector3): Vector3 {

        let q = new Vector3();
        q.addDependency(u, p);
        q.update = () => {
            q.set(p.copy().scale(u.dot(p) / p.dot(p)));
        }
        q.update();

        return q;
    }

    tex(v: Vector3, s: string, replace?: () => string) {

        v.addDependency(this.camera);
        let t = this.viewPort.frame.tex(s)
            .alignCenter();

        t.setAttribute('color', 'var(--font-color)')

        t.addDependency(v);
        t.update = () => {
            let q = this.camera.projectPoint(v);
            let p = this.viewPort.plot.SVGToRelative(q.x, q.y);
            if (replace) {
                t.replace(replace());
            }
            t.moveTo(p);
        }
        t.update();

        return t;
    }

    vectorLabel(v: Vector3, label: string, s: number = 0.6): TeX {
        let t = this.tex(v.add(v.copy().normalize().scale(s)), label);
        t.addDependency(v);
        t.update = () => {
            let u = v.add(v.copy().normalize().scale(s));
            let q = this.camera.projectPoint(u);
            let p = this.viewPort.plot.SVGToRelative(q.x, q.y);
            t.moveTo(p);
        };
        return t;
    }

    vectorCoordinatesPrefix(v: Vector3, prefix: string, s: number = 1.5): TeX {
        let t = this.tex(v.add(v.copy().normalize().scale(s)), `${prefix} \\left[\\begin{array}{c} \\: ${v.x} \\: \\\\ \\: ${v.y} \\: \\\\ \\: ${v.z} \\: \\end{array}\\right]`)
        t.addDependency(v);
        t.update = () => {
            let u = v.add(v.copy().normalize().scale(s));
            let q = this.camera.projectPoint(u);
            let p = this.viewPort.plot.SVGToRelative(q.x, q.y);
            t.moveTo(p);
        };
        return t;
    }

    vectorCoordinates(v: Vector3, s: number = 1.5): TeX {
        let t = this.tex(v.add(v.copy().normalize().scale(s)), `\\left[\\begin{array}{c} \\: ${v.x} \\: \\\\ \\: ${v.y} \\: \\\\ \\: ${v.z} \\: \\end{array}\\right]`)
            .setColor(`${v.x}`, 'var(--green)')
            .setColor(`${v.y}`, 'var(--red)', Number(Math.abs(v.y) === Math.abs(v.x)))
            .setColor(`${v.z}`, 'var(--blue)', Number(v.z === Math.abs(v.x)) + Number(v.z === Math.abs(v.y)));
        return t;
    }

    vectorCoordinates2(v: Vector3, s: number = 1.5, prefix: string = ''): TeX {

        let format = (n: number): string => {
            if (Number(n).toString().length > 2) {
                return n.toFixed(2);
            } else {
                return Number(n).toString();
            }
            // return n.toFixed(2);
        }

        let t = this.tex(v.add(v.copy().normalize().scale(s)), `${prefix}\\left[\\begin{array}{c} \\: ${v.x} \\: \\\\ \\: ${v.y} \\: \\\\ \\: ${v.z} \\: \\end{array}\\right]`)
        t.addDependency(v);
        t.update = () => {
            let u = v.add(v.copy().normalize().scale(s));
            let q = this.camera.projectPoint(u);
            let p = this.viewPort.plot.SVGToRelative(q.x, q.y);
            let x = format(v.x);
            let y = format(v.y);
            let z = format(v.z);
            t.replace(`${prefix}\\left[\\begin{array}{c} \\: ${x} \\: \\\\ \\: ${y} \\: \\\\ \\: ${z} \\: \\end{array}\\right]`)
                .moveTo(p);
        };
        t.update();
        return t;
    }

    vector(v1: Vector3, v2: Vector3, color: string = 'var(--medium)', opacity = 1) {

        v1.addDependency(this.camera);
        v2.addDependency(this.camera);

        let l = this.viewPort.frame.line(0, 0, 0, 0)
        l.setAttribute('stroke', color);
        l.setAttribute('opacity', opacity.toString());
        l.setAttribute('stroke-width', '1.5px');
        l.attatchArrow(this.viewPort.defs, false, color);

        l.addDependency(v1, v2);
        l.update = () => {
            let t1 = this.camera.projectPoint(v1);
            let t2 = this.camera.projectPoint(v2);

            let p1 = this.viewPort.plot.SVGToRelative(t1.x, t1.y);
            let p2 = this.viewPort.plot.SVGToRelative(t2.x, t2.y);

            l.x1 = p1.x;
            l.y1 = p1.y;
            l.x2 = p2.x;
            l.y2 = p2.y;
        }
        l.update();

        return l;
    }

    vectorRectangle(v: Vector3, color: string = 'var(--font-color)', opacity: number = 0.4): Group {

        let g = this.viewPort.frame.group();

        let vx = new Vector3();
        vx.addDependency(v);
        vx.update = () => {
            vx.x = v.x;
        };
        vx.update();

        let vy = new Vector3();
        vy.addDependency(v);
        vy.update = () => {
            vy.y = v.y;
        };
        vy.update();

        let vz = new Vector3();
        vz.addDependency(v);
        vz.update = () => {
            vz.z = v.z;
        };
        vz.update();

        let vxvy = new Vector3();
        vxvy.addDependency(v);
        vxvy.update = () => {
            vxvy.x = v.x;
            vxvy.y = v.y;
        };
        vxvy.update();

        let vxvz = new Vector3();
        vxvz.addDependency(v);
        vxvz.update = () => {
            vxvz.x = v.x;
            vxvz.z = v.z;
        };
        vxvz.update();

        let vyvz = new Vector3();
        vyvz.addDependency(v);
        vyvz.update = () => {
            vyvz.y = v.y;
            vyvz.z = v.z;
        };
        vyvz.update();

        // TODO: vyvz

        // base
        g.appendChild(this.line(vx, vxvy, color, opacity));
        g.appendChild(this.line(vy, vxvy, color, opacity));

        // verticals
        g.appendChild(this.line(vx, vxvz, color, opacity));
        g.appendChild(this.line(vy, vyvz, color, opacity));
        g.appendChild(this.line(vxvy, v, color, opacity));

        // top
        g.appendChild(this.line(vz, vxvz, color, opacity));
        g.appendChild(this.line(vz, vyvz, color, opacity));
        g.appendChild(this.line(vxvz, v, color, opacity));
        g.appendChild(this.line(vyvz, v, color, opacity));

        return g;

    }

    rectangle(v: Vector3, w: Vector3, color: string = 'var(--font-color)', opacity: number = 0.4) {

        // Base
        this.line(new Vector3(v.x, v.y, v.z), new Vector3(w.x, v.y, v.z), color, opacity);
        this.line(new Vector3(v.x, v.y, v.z), new Vector3(v.x, w.y, v.z), color, opacity);
        this.line(new Vector3(w.x, v.y, v.z), new Vector3(w.x, w.y, v.z), color, opacity);
        this.line(new Vector3(v.x, w.y, v.z), new Vector3(w.x, w.y, v.z), color, opacity);

        // Verticals
        this.line(new Vector3(v.x, v.y, v.z), new Vector3(v.x, v.y, w.z), color, opacity);
        this.line(new Vector3(w.x, v.y, v.z), new Vector3(w.x, v.y, w.z), color, opacity);
        this.line(new Vector3(v.x, w.y, v.z), new Vector3(v.x, w.y, w.z), color, opacity);
        this.line(new Vector3(w.x, w.y, v.z), new Vector3(w.x, w.y, w.z), color, opacity);

        // Top
        this.line(new Vector3(v.x, v.y, w.z), new Vector3(w.x, v.y, w.z), color, opacity);
        this.line(new Vector3(v.x, v.y, w.z), new Vector3(v.x, w.y, w.z), color, opacity);
        this.line(new Vector3(w.x, v.y, w.z), new Vector3(w.x, w.y, w.z), color, opacity);
        this.line(new Vector3(v.x, w.y, w.z), new Vector3(w.x, w.y, w.z), color, opacity);
    }


    line(v1: Vector3, v2: Vector3, color: string = 'var(--medium)', opacity = 0.75) {

        v1.addDependency(this.camera);
        v2.addDependency(this.camera);

        let l = this.viewPort.frame.line(0, 0, 0, 0)
        l.setAttribute('stroke', color);
        l.setAttribute('opacity', `${opacity}`);
        l.setAttribute('stroke-width', '1.5px');

        l.addDependency(v1, v2);
        l.update = () => {
            let t1 = this.camera.projectPoint(v1);
            let t2 = this.camera.projectPoint(v2);

            let p1 = this.viewPort.plot.SVGToRelative(t1.x, t1.y);
            let p2 = this.viewPort.plot.SVGToRelative(t2.x, t2.y);

            l.x1 = p1.x;
            l.y1 = p1.y;
            l.x2 = p2.x;
            l.y2 = p2.y;

            if (t1.z < 0 || t2.z < 0) {
                l.setAttribute('opacity', `${0}`);
            } else {
                l.setAttribute('opacity', `${opacity}`);
            }
        }
        l.update();

        return l;
    }

    path(config: { 'stroke'?: string; 'stroke-width'?: string; 'opacity'?: string; } = {}, ...vectors: Vector3[]) {

        let defaultConfig = { 'stroke': 'var(--main)', 'stroke-width': '1.5px', 'opacity': '1' };

        config = { ...defaultConfig, ...config };

        let p = this.viewPort.frame.path();
        p.setAttribute('stroke', config['stroke']);
        p.setAttribute('stroke-width', config['stroke-width']);
        p.setAttribute('opacity', config['opacity']);

        for (let i = 0; i < vectors.length; i++) {
            let v = vectors[i];
            v.addDependency(this.camera);
            p.addDependency(v);
        }

        p.update = () => {
            let d = '';
            for (let i = 0; i < vectors.length; i++) {
                let v = vectors[i];
                let q = this.camera.projectPoint(v);
                let r = this.viewPort.plot.SVGToRelative(q.x, q.y);
                d += `${i === 0 ? 'M' : 'L'} ${r.x} ${r.y}`

            }
            p.d = d;
        }
        p.update();

        return p;
    }

    drawAxes(d: number = 5, options: { color?: string, arrows?: boolean, opacity?: number } = {}) {

        let defaultOptions = {
            color: 'var(--font-color-light)',
            arrows: true,
            opacity: 1
        };

        options = { ...defaultOptions, ...options };

        this.drawAxesHelper(new Vector3(d, 0, 0), new Vector3(-d, 0, 0), options);
        this.drawAxesHelper(new Vector3(0, d, 0), new Vector3(0, -d, 0), options);
        this.drawAxesHelper(new Vector3(0, 0, d), new Vector3(0, 0, -d), options);
    }

    drawAxesHelper(start: Vector3, end: Vector3, options: { color?: string, arrows?: boolean } = {}) {

        let defaultOptions = {
            color: 'var(--font-color-light)',
            arrows: true
        }

        options = { ...defaultOptions, ...options };

        start.addDependency(this.camera);
        end.addDependency(this.camera);

        let axis = this.viewPort.frame.line(0, 0, 0, 0);
        axis.setAttribute('stroke', options.color)
        axis.setAttribute('stroke-width', '1.5px');
        if (options.arrows) {
            axis.attatchArrow(this.viewPort.defs, true, options.color);
            axis.attatchArrow(this.viewPort.defs, false, options.color);
        }

        axis.addDependency(start, end);
        axis.update = () => {
            let projectedPoints = [
                this.camera.projectPoint(start),
                this.camera.projectPoint(end),
            ];

            let axesPoints = [
                this.viewPort.plot.SVGToRelative(projectedPoints[0].x, projectedPoints[0].y),
                this.viewPort.plot.SVGToRelative(projectedPoints[1].x, projectedPoints[1].y),
            ];

            axis.x1 = axesPoints[0].x;
            axis.y1 = axesPoints[0].y;
            axis.x2 = axesPoints[1].x;
            axis.y2 = axesPoints[1].y;
        }
        axis.update();


    }

    drawBasisVectors() {

        let o = new Vector3(0, 0, 0);
        let i = new Vector3(1, 0, 0);
        let j = new Vector3(0, 1, 0);
        let k = new Vector3(0, 0, 1);

        this.vector(o, i, 'var(--green)');
        this.vector(o, j, 'var(--red)');
        this.vector(o, k, 'var(--blue)');

    }

    drawPoint(p: Vector3, options: { color?: string, opacity?: number, radius?: number, scale?: boolean, s?: number } = {}) {

        let defaultOptions = {
            color: 'var(--font-color)',
            opacity: 1,
            radius: 3,
            scale: false,
            s: 150,
        };

        options = { ...defaultOptions, ...options };

        let q = this.camera.projectPoint(p);
        q.addDependency(p, this.camera);
        q.update = () => {
            q = this.camera.projectPoint(p);
        }

        let vbox = this.viewPort.frame.viewBox.split(/[\s,]+/).map(Number)
        let c = this.viewPort.frame.circle(0, 0, 3);
        c.setAttribute('fill', options.color);
        c.setAttribute('opacity', `${options.opacity}`);
        c.addDependency(q)
        c.update = () => {
            let relativePoint = this.viewPort.plot.SVGToRelative(q.x, q.y);
            c.cx = relativePoint.x + vbox[0];
            c.cy = relativePoint.y + vbox[1];
            if (options.scale) {
                c.r = options.s / (q.z * q.z);
            } else {
                c.r = options.radius;
            }

        }
        c.update();

        let r = new Point(0, 0);
        r.addDependency(c);
        r.update = () => {
            r.x = c.cx;
            r.y = c.cy;
        }
        r.update();

        return r;
    }


}