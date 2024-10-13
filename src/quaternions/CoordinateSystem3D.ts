import { Camera } from "./Camera";
import { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";
import { Circle, Frame, Group, Line, Plot, Point, Tex } from "..";
import { StringValue } from "../model/StringValue";

export interface CoordinateSystem3DConfig {
    x?: number;
    y?: number;
    width?: number;
    height?: number;

    viewportX?: number;
    viewportY?: number;
    viewportWidth?: number;
    viewportHeight?: number;

    cameraPosition?: Vector3;
    cameraOrientation?: Quaternion;
    cameraFieldOfView?: number;
    cameraTrackBallInvert?: boolean;
    cameraTrackBallRadius?: number;

    groundGrid?: boolean;
    drawCube?: boolean;
    drawAxes?: boolean;
    drawAxesArrows?: boolean;
    labelAxes?: boolean;
    labelAxesColor?: boolean;
    axesColor?: string;
    tickMarks?: boolean;
    tickMarksColor?: boolean;
    tickMarksColorAlt?: boolean;
    size?: number;
    sizeX?: number;
    sizeY?: number;
    sizeZ?: number;
    distance?: number;
    player?: boolean;
    root?: HTMLElement;
    suffix?: string;
}

export class CoordinateSystem3D {

    origin: Vector3;

    plot: Plot;
    cameraDistance: number;
    camera: Camera;

    axes: Group;
    foreground: Group;
    background: Group;

    yAxis: Line;
    xAxis: Line;
    zAxis: Line;
    xAxisLabel: Tex;
    yAxisLabel: Tex;
    zAxisLabel: Tex;
    upAxis: 'x' | 'y' | 'z';


    constructor(container: Frame | Group, config: CoordinateSystem3DConfig = {}) {

        let defaultConfig = {

            // cameraOrientation: new Quaternion(-1, 0, 0, 0).multiply(Quaternion.fromAxisAngle(new Vector3(0, 0, 1), Math.PI)),
            cameraOrientation: new Quaternion(1, 0, 0, 0),
            cameraPosition: new Vector3(0, 0, -20),
            cameraFieldOfView: 60,
            cameraTrackBallRadius: 2,

            // // 16x9
            // gridWidth: 0.096,
            // gridHeight: 0.054,

            // // 1x1
            // gridWidth: 0.064,
            // gridHeight: 0.064,

            x: 0,
            y: 0,
            width: 540,
            height: 540,

            // 4x3
            viewportWidth: 0.048,
            viewportHeight: 0.048,
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

            groundGrid: true,
            player: true,
            disableEventListeners: false,
        }

        config = { ...defaultConfig, ...config };

        if (isNaN(config.viewportX)) {
            config.viewportX = -config.viewportWidth / 2;
        }

        if (isNaN(config.viewportY)) {
            config.viewportY = -config.viewportHeight / 2;
        }

        this.plot = new Plot(container, {
            x: config.x,
            y: config.y,
            width: config.width,
            height: config.height,
            viewportX: config.viewportX,
            viewportY: config.viewportY,
            viewportWidth: config.viewportWidth,
            viewportHeight: config.viewportHeight,
            // drawGrid: false,
            // axesArrows: false,
            // axesLabels: false,
            // axesColor: 'var(--faint-primary)',
            // axesColor: 'none',
            // big: true,
        })
    
        this.foreground = this.plot.foreground;
        this.background = this.plot.frame.group();
        this.background.root.dataset.role = "background";
        this.axes = this.background.group();

        this.origin = new Vector3(0, 0, 0);
        this.cameraDistance = config.distance;

        let fov = config.cameraFieldOfView;
        let aspectRatio = config.viewportWidth / config.viewportHeight;
        let nearPlane = 0.1;
        let farPlane = 1000;

        this.camera = new Camera(config.cameraPosition, config.cameraOrientation, fov, aspectRatio, nearPlane, farPlane);

        this.registerEventListeners(config.cameraTrackBallRadius, config.cameraTrackBallInvert);

        if (config.groundGrid) {
            this.drawGroundGrid(config.size);
        }

        if (config.drawCube) {
            this.drawCube(config.size, false);
        }

        if (config.drawAxes) {
            let sizes = {
                sizeX: config.sizeX ? config.sizeX : config.size,
                sizeY: config.sizeY ? config.sizeY : config.size,
                sizeZ: config.sizeZ ? config.sizeZ : config.size,
            }
            this.drawAxes(config.size, { ...{ color: config.axesColor, arrows: config.drawAxesArrows }, ...sizes });
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

    registerEventListeners(r = 2, invert = false) {

        let isDragging = false;
        let isSpaceDown = false;
        this.upAxis = 'z';
        let prevX: number = 0;
        let prevY: number = 0;
        let bbox = this.plot.frame.root.getBoundingClientRect();

        /**
         * Projects the coordinates onto the northern hemisphere of a sphere.
         */
        const projectOnTrackball = (touchX: number, touchY: number) => {

            // let d = this.camera.position.length();
            // console.log(d)
            // let r = d*1/Math.sqrt(d*d - 1);

            // let x = touchX / window.innerWidth * 2 - 1;
            // let y = -(touchY / window.innerHeight * 2 - 1);

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
            if (this.plot.frame.root.contains(event.target as HTMLElement)) {
                isDragging = true;
                bbox = this.plot.getFrameBoundingRect();
                this.plot.setCTM();
                this.plot.setBoundingRect();
                prevX = event.clientX;
                prevY = event.clientY;
            }
        };

        // Mouse move handler
        const handleMouseMove = (event: MouseEvent) => {

            if (isDragging && (event.clientX !== prevX || event.clientY !== prevY)) {

                if (isSpaceDown) {

                    const v1 = projectOnTrackball(prevX, prevY);
                    const v2 = projectOnTrackball(event.clientX, event.clientY);

                    const q1 = Quaternion.fromVector(v1);
                    const q2 = Quaternion.fromVector(v2);

                    let r = q2.multiply(q1.conjugate());

                    // Convert the global rotation to a local rotation
                    let localRotation = this.camera.orientation.conjugate().multiply(r).multiply(this.camera.orientation).normalize();

                    // Apply the local rotation to the camera's orientation
                    this.camera.position.apply(localRotation);
                    this.camera.orientation = this.camera.orientation.multiply(localRotation.inverse());


                } else {

                    let up_vec: Vector3;
                    let right_vec: Vector3;

                    if (this.upAxis === 'x') {

                        up_vec = new Vector3(0, 0, 1);
                        right_vec = new Vector3(0, -1, 0);

                        let q = this.camera.orientation.conjugate();
                        let c = q.conjugate();
                        let up = q.multiply(Quaternion.fromVector(up_vec)).multiply(c);
                        let forward = q.multiply(Quaternion.fromVector(right_vec)).multiply(c);

                        let scalar = 200;

                        // TODO: note this is different for some reason
                        let r = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), (event.clientX - prevX) / scalar);
                        let s = Quaternion.fromAxisAngle(up.toVector3().cross(forward.toVector3()).normalize(), (event.clientY - prevY) / scalar);

                        let u = r.multiply(s).normalize();

                        this.camera.position.apply(u);
                        this.camera.orientation = this.camera.orientation.multiply(u.inverse()).normalize();

                    } else if (this.upAxis === 'y') {

                        up_vec = new Vector3(0, 1, 0);
                        right_vec = new Vector3(0, 0, 1);

                        let q = this.camera.orientation.conjugate();
                        let c = q.conjugate();
                        let up = q.multiply(Quaternion.fromVector(up_vec)).multiply(c);
                        let forward = q.multiply(Quaternion.fromVector(right_vec)).multiply(c);

                        let scalar = 200;
                        let r = Quaternion.fromAxisAngle(up.toVector3().cross(forward.toVector3()).normalize(), (event.clientY - prevY) / scalar);
                        let s = Quaternion.fromAxisAngle(up_vec, (event.clientX - prevX) / scalar);

                        let u = s.multiply(r).normalize();

                        this.camera.position.apply(u);
                        this.camera.orientation = this.camera.orientation.multiply(u.inverse()).normalize();

                    } else {

                        up_vec = new Vector3(0, 0, 1);
                        right_vec = new Vector3(0, 1, 0);
                        let q = this.camera.orientation.conjugate();
                        let c = q.conjugate();
                        let up = q.multiply(Quaternion.fromVector(up_vec)).multiply(c);
                        let forward = q.multiply(Quaternion.fromVector(right_vec)).multiply(c);

                        let scalar = 200;
                        let r = Quaternion.fromAxisAngle(up.toVector3().cross(forward.toVector3()).normalize(), -(event.clientY - prevY) / scalar);
                        // let r = Quaternion.fromAxisAngle(forward.toVector3().cross(up.toVector3()).normalize(), (event.clientY - prevY)/scalar);
                        let s = Quaternion.fromAxisAngle(up_vec, -(event.clientX - prevX) / scalar);

                        let u = s.multiply(r).normalize();

                        this.camera.position.apply(u);
                        this.camera.orientation = this.camera.orientation.multiply(u.inverse()).normalize();
                    }

                }

                event.preventDefault();

            }

            prevX = event.clientX;
            prevY = event.clientY;


        };

        // Mouse up handler
        const handleMouseUp = () => {
            isDragging = false;
            this.plot.releaseBoundingRect();
            this.plot.releaseCTM();
        };

        let scaleFactor = 1.1;

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
                    // console.log(`cameraOrientation: ${this.camera.orientation.toConstructor((n) => n.toFixed(3))}, \n        cameraPosition: ${this.camera.position.toConstructor((n) => n.toFixed(3))},`);
                    console.log(`let cameraOrientation = ${this.camera.orientation.toConstructor((n) => n.toFixed(5))}; \n        let cameraPosition = ${this.camera.position.toConstructor((n) => n.toFixed(5))};`);
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
                    this.upAxis = 'x';
                    this.camera.orientation.set(new Quaternion(1, 0, 0, 0).multiply(Quaternion.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2)));
                    this.camera.position.set(new Vector3(0, 0, -this.camera.position.length()))
                    this.camera.orientation.updateDependents();
                    this.camera.position.updateDependents();
                    this.camera.updateDependents();


                    // this.camera.lookAt(this.origin, new Vector3(-1, 0, 0));
                    event.preventDefault();
                    break;
                case 'y':
                    this.upAxis = 'y';
                    this.camera.orientation.set(new Quaternion(1, 0, 0, 0));
                    this.camera.position.set(new Vector3(0, 0, -this.camera.position.length()))
                    this.camera.orientation.updateDependents();
                    this.camera.position.updateDependents();
                    this.camera.updateDependents();

                    // this.camera.lookAt(this.origin, new Vector3(0, -1, 0));
                    event.preventDefault();
                    break;
                case 'z':
                    this.upAxis = 'z';
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

    static generateVerticalSlices(lats: number, longs: number, r: Quaternion = Quaternion.identity()): Vector3[][] {
        let points: Vector3[][] = [];

        for (let longIndex = 0; longIndex < longs; longIndex++) {

            let slice: Vector3[] = [];

            let long = (2 * Math.PI * longIndex / longs);

            for (let latIndex = 0; latIndex <= lats; latIndex++) {

                let lat = (Math.PI / 2) - (Math.PI * latIndex / lats);

                let p = CoordinateSystem3D.convertSphericalToCartesian(lat, long);

                slice.push(p.apply(r));

            }

            points.push(slice);
        }

        return points;
    }

    static generateHorizontalSlices(lats: number, longs: number, r: Quaternion = Quaternion.identity()): Vector3[][] {
        let points: Vector3[][] = [];

        for (let latIndex = 1; latIndex < lats; latIndex++) {
            let slice: Vector3[] = [];

            // Compute the latitude angle, ranging from -90 to 90 degrees
            let lat = (Math.PI / 2) - (Math.PI * latIndex / lats);

            // For each latitude, iterate over longitude
            for (let longIndex = 0; longIndex <= longs; longIndex++) {
                // Compute the longitude angle, ranging from 0 to 360 degrees
                let long = (2 * Math.PI * longIndex / longs);

                let p = CoordinateSystem3D.convertSphericalToCartesian(lat, long);

                slice.push(p.apply(r));
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
                points.push(CoordinateSystem3D.convertSphericalToCartesian(lat, 0));
                continue;
            }

            for (let longIndex = 0; longIndex < lats; longIndex++) {
                // Compute the longitude angle, ranging from 0 to 360 degrees
                let long = (2 * Math.PI * longIndex / lats);
                points.push(CoordinateSystem3D.convertSphericalToCartesian(lat, long));
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

        this.xAxisLabel = this.tex(new Vector3(1, 0, 0).scale(c + options.a), 'x')
        this.yAxisLabel = this.tex(new Vector3(0, 1, 0).scale(c + options.a), 'y')
        this.zAxisLabel = this.tex(new Vector3(0, 0, 1).scale(c + options.a), 'z')

        if (options.color) {
            this.xAxisLabel.setColorAll('x', 'var(--green)');
            this.yAxisLabel.setColorAll('y', 'var(--red)');
            this.zAxisLabel.setColorAll('z', 'var(--blue)');
        }

        let group = this.axes.group();
        group.appendChild(this.xAxisLabel);
        group.appendChild(this.yAxisLabel);
        group.appendChild(this.zAxisLabel);
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

        let color = 'var(--font-color-light)';
        for (let d = 1; d <= c; d++) {

            // Positive z Direction
            this.line(new Vector3(a, 0, d), new Vector3(-a, 0, d), color, opacity);
            this.line(new Vector3(0, a, d), new Vector3(0, -a, d), color, opacity);

            // Negative z Direction
            this.line(new Vector3(a, 0, -d), new Vector3(-a, 0, -d), color, opacity);
            this.line(new Vector3(0, a, -d), new Vector3(0, -a, -d), color, opacity);

            // Positive x Direction
            this.line(new Vector3(d, a, 0), new Vector3(d, -a, 0), color, opacity);
            this.line(new Vector3(d, 0, a), new Vector3(d, 0, -a), color, opacity);

            // Negative x Direction
            this.line(new Vector3(-d, a, 0), new Vector3(-d, -a, 0), color, opacity);
            this.line(new Vector3(-d, 0, a), new Vector3(-d, 0, -a), color, opacity);

            // Positive y Direction
            this.line(new Vector3(a, d, 0), new Vector3(-a, d, 0), color, opacity);
            this.line(new Vector3(0, d, a), new Vector3(0, d, -a), color, opacity);

            // Negative y Direction
            this.line(new Vector3(a, -d, 0), new Vector3(-a, -d, 0), color, opacity);
            this.line(new Vector3(0, -d, a), new Vector3(0, -d, -a), color, opacity);
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

        let cubeColor = 'var(--faint)';
        let t1 = new Vector3(-c, -c, c);
        let t2 = new Vector3(c, -c, c);
        let t3 = new Vector3(c, c, c);
        let t4 = new Vector3(-c, c, c);

        if (points) {
            this.drawPoint(t1, { color: cubeColor });
            this.drawPoint(t2, { color: cubeColor });
            this.drawPoint(t3, { color: cubeColor });
            this.drawPoint(t4, { color: cubeColor });
        }


        this.line(t1, t2, cubeColor);
        this.line(t2, t3, cubeColor);
        this.line(t3, t4, cubeColor);
        this.line(t4, t1, cubeColor);

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
            this.drawPoint(b1, { color: cubeColor });
            this.drawPoint(b2, { color: cubeColor });
            this.drawPoint(b3, { color: cubeColor });
            this.drawPoint(b4, { color: cubeColor });
        }

        this.line(b1, b2, cubeColor);
        this.line(b2, b3, cubeColor);
        this.line(b3, b4, cubeColor);
        this.line(b4, b1, cubeColor);

        this.line(t1, b1, cubeColor);
        this.line(t2, b2, cubeColor);
        this.line(t3, b3, cubeColor);
        this.line(t4, b4, cubeColor);
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

    tex(v: Vector3, s: string, replace?: () => string, background = true) {

        v.addDependency(this.camera);
        let t = this.plot.frame.tex(s, 0, 0, background)
            .alignCenter();

        t.setAttribute('color', 'var(--font-color)')

        t.addDependency(v);
        t.update = () => {
            let q = this.camera.projectPoint(v);
            let p = this.plot.viewportToFrame(q.x, q.y);
            if (replace) {
                t.replace(replace());
            }
            t.moveTo(p);
        }
        t.update();

        return t;
    }

    vectorLabel(v: Vector3, label: string, s: number = 0.6): Tex {
        let t = this.tex(v.add(v.copy().normalize().scale(s)), label);
        t.addDependency(v);
        t.update = () => {
            let u = v.add(v.copy().normalize().scale(s));
            let q = this.camera.projectPoint(u);
            let p = this.plot.viewportToFrame(q.x, q.y);
            t.moveTo(p);
        };
        return t;
    }

    vectorCoordinatesPrefix(v: Vector3, prefix: string, s: number = 1.5): Tex {
        let t = this.tex(v.add(v.copy().normalize().scale(s)), `${prefix} \\left[\\begin{array}{c} \\: ${v.x} \\: \\\\ \\: ${v.y} \\: \\\\ \\: ${v.z} \\: \\end{array}\\right]`)
        t.addDependency(v);
        t.update = () => {
            let u = v.add(v.copy().normalize().scale(s));
            let q = this.camera.projectPoint(u);
            let p = this.plot.viewportToFrame(q.x, q.y);
            t.moveTo(p);
        };
        return t;
    }

    vectorCoordinates(v: Vector3, s: number = 1.5): Tex {
        let t = this.tex(v.add(v.copy().normalize().scale(s)), `\\left[\\begin{array}{c} \\: ${v.x} \\: \\\\ \\: ${v.y} \\: \\\\ \\: ${v.z} \\: \\end{array}\\right]`)
            .setColor(`${v.x}`, 'var(--green)')
            .setColor(`${v.y}`, 'var(--red)', Number(Math.abs(v.y) === Math.abs(v.x)))
            .setColor(`${v.z}`, 'var(--blue)', Number(v.z === Math.abs(v.x)) + Number(v.z === Math.abs(v.y)));
        return t;
    }

    vectorCoordinates2(v: Vector3, s: number = 1.5, prefix: string = ''): Tex {

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
            let p = this.plot.viewportToFrame(q.x, q.y);
            let x = format(v.x);
            let y = format(v.y);
            let z = format(v.z);
            t.replace(`${prefix}\\left[\\begin{array}{c} \\: ${x} \\: \\\\ \\: ${y} \\: \\\\ \\: ${z} \\: \\end{array}\\right]`)
                .moveTo(p);
        };
        t.update();
        return t;
    }

    // TODO: refactor into options
    vector(v1: Vector3, v2: Vector3, color: string = 'var(--font-color)', opacity = 1): Line {

        v1.addDependency(this.camera);
        v2.addDependency(this.camera);

        let l = this.plot.frame.line(0, 0, 0, 0)
        l.setAttribute('stroke', color);
        l.setAttribute('opacity', opacity.toString());
        l.setAttribute('stroke-width', '1.5px');
        l.attatchArrow(this.plot.frame.definitions, false, color);

        l.addDependency(v1, v2);
        l.update = () => {
            let t1 = this.camera.projectPoint(v1);
            let t2 = this.camera.projectPoint(v2);

            let p1 = this.plot.viewportToFrame(t1.x, t1.y);
            let p2 = this.plot.viewportToFrame(t2.x, t2.y);

            l.x1 = p1.x;
            l.y1 = p1.y;
            l.x2 = p2.x;
            l.y2 = p2.y;
        }
        l.update();

        return l;
    }

    vectorRectangle(v: Vector3, color: string = 'var(--font-color)', opacity: number = 0.4): Group {

        let g = this.plot.frame.group();

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

        let l = this.plot.frame.line(0, 0, 0, 0)
        l.setAttribute('stroke', color);
        l.setAttribute('opacity', `${opacity}`);
        l.setAttribute('stroke-width', '1.5px');

        l.addDependency(v1, v2);
        l.update = () => {
            let t1 = this.camera.projectPoint(v1);
            let t2 = this.camera.projectPoint(v2);

            let p1 = this.plot.viewportToFrame(t1.x, t1.y);
            let p2 = this.plot.viewportToFrame(t2.x, t2.y);

            l.x1 = p1.x;
            l.y1 = p1.y;
            l.x2 = p2.x;
            l.y2 = p2.y;

            // if (t1.z < 0 || t2.z < 0) {
            //     l.setAttribute('opacity', `${0}`);
            // } else {
            //     l.setAttribute('opacity', `${opacity}`);
            // }
            l.setAttribute('opacity', `${opacity}`);

        }
        l.update();

        return l;
    }

    path(config: { 'fill'?: string; 'stroke'?: string; 'stroke-width'?: string; 'opacity'?: string; } = {}, ...vectors: Vector3[]) {

        let defaultConfig = { 'stroke': 'var(--main)', 'stroke-width': '1.5px', 'opacity': '1' };

        config = { ...defaultConfig, ...config };

        let p = this.plot.frame.path();
        p.setAttribute('fill', config['fill']);
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
                let r = this.plot.viewportToFrame(q.x, q.y);
                d += `${i === 0 ? 'M' : 'L'} ${r.x} ${r.y}`

            }
            p.d = d;
        }
        p.update();

        return p;
    }

    drawAxes(d: number = 5, options: { color?: string, arrows?: boolean, opacity?: number, sizeX?: number, sizeY?: number, sizeZ?: number } = {}) {

        let defaultOptions = {
            color: 'var(--font-color-light)',
            arrows: true,
            opacity: 1,
            sizeX: d,
            sizeY: d,
            sizeZ: d,
        };

        options = { ...defaultOptions, ...options };

        let x = options.sizeX;
        let y = options.sizeY;
        let z = options.sizeZ;

        this.xAxis = this.drawAxesHelper(new Vector3(x, 0, 0), new Vector3(-x, 0, 0), options);
        this.yAxis = this.drawAxesHelper(new Vector3(0, y, 0), new Vector3(0, -y, 0), options);
        this.zAxis = this.drawAxesHelper(new Vector3(0, 0, z), new Vector3(0, 0, -z), options);
    }

    drawAxesHelper(start: Vector3, end: Vector3, options: { color?: string, arrows?: boolean } = {}): Line {

        let defaultOptions = {
            color: 'var(--font-color-light)',
            arrows: true
        }

        options = { ...defaultOptions, ...options };

        start.addDependency(this.camera, this.camera.position);
        end.addDependency(this.camera, this.camera.position);

        let axis = this.axes.line(0, 0, 0, 0);
        axis.setAttribute('stroke', options.color)
        axis.setAttribute('stroke-width', '1.5px');
        if (options.arrows) {
            axis.attatchArrow(this.plot.frame.definitions, true, options.color);
            axis.attatchArrow(this.plot.frame.definitions, false, options.color);
        }

        axis.addDependency(start, end);
        axis.update = () => {
            let projectedPoints = [
                this.camera.projectPoint(start),
                this.camera.projectPoint(end),
            ];

            let axesPoints = [
                this.plot.viewportToFrame(projectedPoints[0]),
                this.plot.viewportToFrame(projectedPoints[1]),
            ];

            axis.x1 = axesPoints[0].x;
            axis.y1 = axesPoints[0].y;
            axis.x2 = axesPoints[1].x;
            axis.y2 = axesPoints[1].y;
        }
        axis.update();
        return axis;


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

    drawPoint(p: Vector3, options: { color?: string, opacity?: number, radius?: number, scale?: boolean, s?: number, colorValue?: StringValue, } = {}): Circle {

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

        let vbox = this.plot.frame.viewBox.split(/[\s,]+/).map(Number)
        let c = this.plot.frame.circle(0, 0, 3);
        c.setAttribute('fill', options.color);
        c.setAttribute('opacity', `${options.opacity}`);
        c.addDependency(q, options.colorValue)
        c.update = () => {
            let relativePoint = this.plot.viewportToFrame(q.x, q.y);
            c.cx = relativePoint.x + vbox[0];
            c.cy = relativePoint.y + vbox[1];
            if (options.scale) {
                c.r = options.s / (q.z * q.z);
            } else {
                c.r = options.radius;
            }
            if (options.colorValue) {
                c.setAttribute('fill', options.colorValue.value)
            }
            if (q.z === 0) {
                c.setAttribute('opacity', '0')
            } else if (isFinite(options.opacity)) {
                c.setAttribute('opacity', options.opacity.toFixed(2))
            } else {
                c.setAttribute('opacity', '1')
            }

        }
        c.update();
        return c;
    }


}