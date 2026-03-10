import { Frame, Group, Tex } from ".";
import { Quaternion, Vector3 } from "./quaternions";
import { CoordinateSystem3D, CoordinateSystem3DConfig } from "./quaternions/CoordinateSystem3D";
import { ScenePlayer } from "./ScenePlayer";

export class TransformationPlot3D extends CoordinateSystem3D {

    i: Vector3;
    j: Vector3;
    k: Vector3;

    ihat: Tex;
    jhat: Tex;
    khat: Tex;

    constructor(frame:Frame | Group, config:CoordinateSystem3DConfig) {

        let cameraOrientation = new Quaternion(0.66456, 0.40972, 0.32796, -0.53192); 
        let cameraPosition = new Vector3(8.71773, -1.95678, -4.49134);

        let defaultConfig = {
            width: 640,
            height: 360,
            viewportWidth: 0.096,
            viewportHeight: 0.096 * config.height / config.width,
            cameraOrientation: cameraOrientation,
            cameraPosition: cameraPosition,
            groundGrid: false,
            size: 3,
            tickMarks: false,
        }

        config = {...defaultConfig, ...config}

        super(frame, config)

        this.i = new Vector3(1, 0, 0);
        this.j = new Vector3(0, 1, 0);
        this.k = new Vector3(0, 0, 1);

        let i = this.i;
        let j = this.j;
        let k = this.k;
        let v = new Vector3(2, 1, 3);

        let drawBasisLabels = true;
        if (drawBasisLabels) {
            this.ihat = this.vectorLabel(this.i, '\\hat{\\imath}');
            this.ihat.setAttribute('color', 'var(--green)');

            this.jhat = this.vectorLabel(this.j, '\\hat{\\jmath}');
            this.jhat.setAttribute('color', 'var(--red)');

            this.khat = this.vectorLabel(this.k, '\\hat{k}');
            this.khat.setAttribute('color', 'var(--blue)');
        }

        this.vector(this.origin, j, 'var(--red)');
        this.vector(this.origin, i, 'var(--green)');
        this.vector(this.origin, k, 'var(--blue)');

        let drawVectorCoordinates = false;
        if (drawVectorCoordinates) {
            this.vectorRectangle(i, 'var(--green)')
            this.vectorRectangle(j, 'var(--red)')
            this.vectorRectangle(k, 'var(--blue)')
        }


        this.drawParallelepided( i, j, k);


    }
}
