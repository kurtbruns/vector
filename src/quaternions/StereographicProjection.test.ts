import { Quaternion } from "./Quaternion";
import { Vector2 } from "./Vector2";
import { Vector3 } from "./Vector3";
import { stereographicProjection } from './StereographicProjection'

function normalize(v:Vector2) {
    v.x = v.x === -0 ? 0 : v.x;
    v.y = v.y === -0 ? 0 : v.y;
}

describe('StereographicProjection', () => {

    test('Standard direction (positive Z direction)', () => {
        let actual = new Vector2(0,0);
        let expected = normalize(stereographicProjection(new Vector3(0, 0, -1)));
        expect(expected).toEqual(normalize(actual));
    });

});
