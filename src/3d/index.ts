import { Camera } from './Camera';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';
import { Scene3D } from './Scene3D';
import { TrackBall } from './TrackBall';
import { SphereScene } from './SphereScene';
import { StereographicProjectionScene } from './StereographicProjectionScene';
import { Cube } from './Cube';

let scene = new SphereScene()

new StereographicProjectionScene(scene);

// new Cube();

// new Scene3D()



// new Span();

// new TrackBall();

// console.log('Project Origin:', camera.projectPoint(new Vector3(0, 0, 0)));
