import { Definitions } from '../..';
import { Line } from '../../elements/svg/line';

/**
 * `attatchArrow` was the original, misspelled name. It stays as a forwarding alias
 * because content pages pinned to older versions call it, and they only migrate when
 * they are thawed and upgraded. Spying on `attachArrow` keeps this off the real
 * implementation, which needs `getTotalLength` that jsdom does not provide.
 */
it('attatchArrow forwards to attachArrow unchanged', () => {
    const line = new Line(0, 0, 10, 0);
    const defs = new Definitions();
    const spy = jest.spyOn(line, 'attachArrow').mockReturnValue(null);

    line.attatchArrow(defs, false, 'var(--red)');

    expect(spy).toHaveBeenCalledWith(defs, false, 'var(--red)');
});

it('attatchArrow keeps attachArrow defaults', () => {
    const line = new Line(0, 0, 10, 0);
    const defs = new Definitions();
    const spy = jest.spyOn(line, 'attachArrow').mockReturnValue(null);

    line.attatchArrow(defs);

    expect(spy).toHaveBeenCalledWith(defs, true, undefined);
});
