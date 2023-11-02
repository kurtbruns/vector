import JSZip from 'jszip';
import { Scene, SceneMode } from '../scene';
import { bundle } from './svg';
import { saveAs } from './save-as';

/**
 * Exports the scene as a zip of SVG frames.
 */
export function downloadSceneZip(scene: Scene, filename:string = 'frames') {

    scene.setMode(SceneMode.Export);
    const zip = new JSZip();
    let count = 0;
  
    const frameCallback = () => {
        zip.file(`frame${count++}.svg`, bundle(scene.frame.root));
    };
  
    scene
        .export(frameCallback)
        .then(() => {
            zip.generateAsync({ type: 'blob' }).then(function (content) {
                saveAs(content, `${filename}`, {});
            });
        })
        .catch((error) => {
            console.error('An error occurred:', error);
        });
  }