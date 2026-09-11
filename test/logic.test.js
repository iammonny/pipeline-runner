import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GROUND_Y, JUMP_VELOCITY, BASE_SPEED,
  createRunner, jump, stepRunner, speedForScore, collides,
  stepObstacles, shouldSpawn, makeObstacle, formatScore,
} from '../src/logic.js';

test('a new runner starts on the ground', () => {
  const r = createRunner();
  assert.equal(r.y, GROUND_Y);
  assert.equal(r.onGround, true);
});

test('jumping from the ground sets upward velocity', () => {
  const r = jump(createRunner());
  assert.equal(r.vy, JUMP_VELOCITY);
  assert.equal(r.onGround, false);
});

test('cannot double-jump while in the air', () => {
  const inAir = jump(createRunner());
  const again = jump({ ...inAir, vy: -2 });
  assert.equal(again.vy, -2, 'velocity should be untouched');
});

test('gravity brings the runner back to the ground', () => {
  let r = jump(createRunner());
  for (let i = 0; i < 200 && !r.onGround; i++) r = stepRunner(r);
  assert.equal(r.onGround, true);
  assert.equal(r.y, GROUND_Y);
});

test('speed starts at base speed and increases with score', () => {
  assert.equal(speedForScore(0), BASE_SPEED);
  assert.ok(speedForScore(1000) > speedForScore(100));
  assert.ok(speedForScore(1e9) <= BASE_SPEED + 6, 'speed is capped');
});

test('collision detects overlap and ignores separation', () => {
  const runner = { x: 40, y: GROUND_Y, w: 28, h: 32 };
  assert.equal(collides(runner, { x: 50, y: GROUND_Y, w: 22, h: 22 }), true);
  assert.equal(collides(runner, { x: 300, y: GROUND_Y, w: 22, h: 22 }), false);
  const jumped = { ...runner, y: GROUND_Y - 60 };
  assert.equal(collides(jumped, { x: 50, y: GROUND_Y, w: 22, h: 22 }), false, 'runner above the bug');
});

test('obstacles scroll left and disappear off screen', () => {
  const obs = [{ x: 10, y: GROUND_Y, w: 22, h: 22 }, { x: 400, y: GROUND_Y, w: 22, h: 22 }];
  const next = stepObstacles(obs, 40);
  assert.equal(next.length, 1);
  assert.equal(next[0].x, 360);
});

test('spawning respects the minimum gap', () => {
  const always = () => 0; // rng that always says "spawn"
  assert.equal(shouldSpawn([], 600, 200, always), true);
  const close = [{ x: 500, y: GROUND_Y, w: 22, h: 22 }];
  assert.equal(shouldSpawn(close, 600, 200, always), false);
  const far = [{ x: 100, y: GROUND_Y, w: 22, h: 22 }];
  assert.equal(shouldSpawn(far, 600, 200, always), true);
});

test('obstacles spawn at the right edge', () => {
  const o = makeObstacle(600, () => 0.9);
  assert.equal(o.x, 600);
  assert.equal(o.kind, 'bug');
  assert.equal(makeObstacle(600, () => 0.1).kind, 'critical');
});

test('score is zero-padded to five digits', () => {
  assert.equal(formatScore(0), '00000');
  assert.equal(formatScore(42.9), '00042');
  assert.equal(formatScore(123456), '123456');
});
