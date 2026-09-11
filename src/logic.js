// Pure game logic. No canvas, no DOM, no timers: only numbers in, numbers out.
// Keeping it here means the unit tests can exercise it without a browser,
// and the same file is imported by the game in the browser.

export const GROUND_Y = 150;      // y of the ground line inside the game world
export const GRAVITY = 0.6;       // pixels per frame^2
export const JUMP_VELOCITY = -11; // negative = up
export const BASE_SPEED = 5;      // world scroll speed at score 0

/** Create the starting state of the runner (the robot). */
export function createRunner() {
  return { x: 40, y: GROUND_Y, w: 28, h: 32, vy: 0, onGround: true };
}

/** Apply a jump if the runner is on the ground. Returns a new runner. */
export function jump(runner) {
  if (!runner.onGround) return runner;
  return { ...runner, vy: JUMP_VELOCITY, onGround: false };
}

/** Advance the runner one frame under gravity. Returns a new runner. */
export function stepRunner(runner) {
  if (runner.onGround) return runner;
  const vy = runner.vy + GRAVITY;
  let y = runner.y + vy;
  if (y >= GROUND_Y) return { ...runner, y: GROUND_Y, vy: 0, onGround: true };
  return { ...runner, y, vy };
}

/** Speed grows slowly with score so the game gets harder. */
export function speedForScore(score) {
  return BASE_SPEED + Math.min(score / 150, 6);
}

/** Axis-aligned bounding-box overlap. Boxes are {x, y, w, h}; y is the bottom edge. */
export function collides(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y - a.h < b.y &&
    a.y > b.y - b.h
  );
}

/** Move obstacles left and drop the ones that left the screen. */
export function stepObstacles(obstacles, speed) {
  return obstacles
    .map((o) => ({ ...o, x: o.x - speed }))
    .filter((o) => o.x + o.w > 0);
}

/** Decide whether a new obstacle should spawn given the last one. */
export function shouldSpawn(obstacles, worldWidth, minGap, rng = Math.random) {
  if (obstacles.length === 0) return true;
  const last = obstacles[obstacles.length - 1];
  const gap = worldWidth - (last.x + last.w);
  return gap > minGap && rng() < 0.03;
}

/** Make a bug obstacle at the right edge of the world. */
export function makeObstacle(worldWidth, rng = Math.random) {
  const tall = rng() < 0.3;
  return { x: worldWidth, y: GROUND_Y, w: tall ? 18 : 22, h: tall ? 34 : 22, kind: tall ? 'critical' : 'bug' };
}

/** Format a score the way the HUD shows it: five digits, zero-padded. */
export function formatScore(score) {
  return String(Math.floor(score)).padStart(5, '0');
}
