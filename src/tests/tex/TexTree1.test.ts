import { Tex } from '../..';

const tree1 = 
`<svg xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" fill="currentColor" stroke-width="0">
        <g data-mml-node="math">
            <g data-mml-node="mn">
                <path data-c="31"></path>
            </g>
            <g data-mml-node="mo">
                <path data-c="2B"></path>
            </g>
            <g data-mml-node="mn">
                <path data-c="32"></path>
            </g>
        </g>
    </g>
</svg>`;

const match1 = 
`<svg xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" fill="currentColor" stroke-width="0">
        <g data-mml-node="math">
            <g data-mml-node="mn">
                <path data-c="31"></path>
            </g>
        </g>
    </g>
</svg>`;

const subtree1 = 
`<g data-mml-node="mn">
    <path data-c="31"></path>
</g>`;

const match2 = 
`<svg xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" fill="currentColor" stroke-width="0">
        <g data-mml-node="math">
            <g data-mml-node="mo">
            <path data-c="2B"></path>
            </g>
        </g>
    </g>
</svg>`;

const subtree2 = 
`<g data-mml-node="mn">
    <path data-c="31"></path>
</g>`;

const match3 = 
`<svg xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" fill="currentColor" stroke-width="0">
        <g data-mml-node="math">
            <g data-mml-node="mn">
                <path data-c="32"></path>
            </g>
        </g>
    </g>
</svg>`;

const subtree3 = 
`<g data-mml-node="mn">
    <path data-c="32"></path>
</g>`;

const match4 = 
`<svg xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" fill="currentColor" stroke-width="0">
        <g data-mml-node="math">
            <g data-mml-node="mn">
                <path data-c="31"></path>
            </g>
            <g data-mml-node="mo">
                <path data-c="2B"></path>
            </g>
        </g>
    </g>
</svg>`;

const subtree4 = 
`<g data-mml-node="mn">
    <path data-c="31"></path>
</g>
<g data-mml-node="mo">
    <path data-c="2B"></path>
</g>
`;

beforeEach(() => {
    document.body.innerHTML = tree1;
});

afterEach(() => {
    document.body.innerHTML = '';
});

describe('subtree match', () => {

    it('sanity test', () => {
        let root = document.querySelectorAll('[data-mml-node="math"]')[0];
        expect(root).not.toBe(null);
        expect(root?.getAttribute('data-mml-node')).toBe('math')
    });

    // it('match1', () => {

    //     document.body.innerHTML += match1;

    //     let root = document.querySelectorAll('[data-mml-node="math"]')[0];
    //     let match = document.querySelectorAll('[data-mml-node="math"]')[1];
    
    //     let subtree = TeX.findMatchingSubtree(root, match);
    //     expect(subtree).not.toBe(null);
    //     expect(subtree).not.toBe(subtree1)
    // });

    // it('match2', () => {

    //     document.body.innerHTML += match2;

    //     let root = document.querySelectorAll('[data-mml-node="math"]')[0];
    //     let match = document.querySelectorAll('[data-mml-node="math"]')[1];
    //     let subtree = TeX.findMatchingSubtree(root, match);
    //     expect(subtree).not.toBe(null);
    //     expect(subtree).not.toBe(subtree2)
    // });

    // it('match3', () => {

    //     document.body.innerHTML += match3;

    //     let root = document.querySelectorAll('[data-mml-node="math"]')[0];
    //     let match = document.querySelectorAll('[data-mml-node="math"]')[1];
    //     let subtree = TeX.findMatchingSubtree(root, match);
    //     expect(subtree).not.toBe(null);
    //     expect(subtree).not.toBe(subtree3)
    // });

    // it('match4', () => {

    //     document.body.innerHTML += match3;

    //     let root = document.querySelectorAll('[data-mml-node="math"]')[0];
    //     let match = document.querySelectorAll('[data-mml-node="math"]')[1];
    //     let subtree = TeX.findMatchingSubtree(root, match);
    //     expect(subtree).not.toBe(null);
    //     expect(subtree).not.toBe(subtree4)
    // });

})

