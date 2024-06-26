/**
 * https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
 */
export function mulberry32( a : number ) {

  /**
   * Returns a random number between 0 and 1.
   */
  return function() : number {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}