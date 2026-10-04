/**
 * Artisan locations are stored precisely (often their home or workshop). The map only ever
 * receives them rounded to 2 decimal places, about 1.1 km, so customers see the area an
 * artisan works in, never an exact address.
 */
export const approxCoord = (n: number) => Math.round(n * 100) / 100;

/** Nigeria's bounding box ([south, west], [north, east]), used to frame the map. */
export const NIGERIA_BOUNDS: [[number, number], [number, number]] = [[4.2, 2.6], [13.9, 14.7]];

export function inNigeria(lat: number, lng: number): boolean {
  const [[s, w], [n, e]] = NIGERIA_BOUNDS;
  return lat >= s && lat <= n && lng >= w && lng <= e;
}
