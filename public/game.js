// Browser side: draws the world and handles input. All the rules live in src/logic.js.
import {
  GROUND_Y, createRunner, jump, stepRunner, speedForScore, collides,
  stepObstacles, shouldSpawn, makeObstacle, formatScore,
} from '/src/logic.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayHint = document.getElementById('overlay-hint');

const WORLD_W = canvas.width;   // 600
const MIN_GAP = 220;
const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
const bugColor = getComputedStyle(document.documentElement).getPropertyValue('--bug').trim();
const critColor = getComputedStyle(document.documentElement).getPropertyValue('--critical').trim();
const botColor = getComputedStyle(document.documentElement).getPropertyValue('--bot').trim();

let state = 'ready'; // ready | running | over
let runner, obstacles, score, best = 0, groundOffset = 0, frame = 0;

function reset() {
  runner = createRunner();
  obstacles = [];
  score = 0;
  groundOffset = 0;
  frame = 0;
}

function start() {
  reset();
  state = 'running';
  overlay.hidden = true;
}

function gameOver() {
  state = 'over';
  best = Math.max(best, score);
  bestEl.textContent = formatScore(best);
  overlayTitle.textContent = 'Build failed';
  overlayHint.textContent = `Merged ${formatScore(score)} PRs. Press space to retry.`;
  overlay.hidden = false;
}

function onJump() {
  if (state === 'running') runner = jump(runner);
  else start();
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); onJump(); }
});
canvas.addEventListener('pointerdown', onJump);
overlay.addEventListener('pointerdown', onJump);

function update() {
  if (state !== 'running') return;
  frame++;
  const speed = speedForScore(score);
  runner = stepRunner(runner);
  obstacles = stepObstacles(obstacles, speed);
  if (shouldSpawn(obstacles, WORLD_W, MIN_GAP)) obstacles.push(makeObstacle(WORLD_W));
  score += speed / 10;
  groundOffset = (groundOffset + speed) % 24;
  scoreEl.textContent = formatScore(score);
  if (obstacles.some((o) => collides(runner, o))) gameOver();
}

function drawRunner(r) {
  const top = r.y - r.h;
  ctx.fillStyle = botColor;
  ctx.fillRect(r.x, top + 8, r.w, r.h - 8);          // body
  ctx.fillRect(r.x + 4, top, r.w - 8, 10);            // head
  ctx.fillStyle = ink;
  ctx.fillRect(r.x + 8, top + 3, 4, 4);               // eyes
  ctx.fillRect(r.x + 16, top + 3, 4, 4);
  ctx.fillRect(r.x + r.w / 2 - 1, top - 5, 2, 5);     // antenna
  if (r.onGround) {                                    // legs alternate while running
    const stride = Math.floor(frame / 6) % 2 === 0;
    ctx.fillRect(r.x + (stride ? 4 : 14), r.y - 2, 8, 4);
    ctx.fillRect(r.x + (stride ? 16 : 6), r.y - 6, 8, 4);
  } else {
    ctx.fillRect(r.x + 4, r.y - 4, 8, 4);
    ctx.fillRect(r.x + 16, r.y - 4, 8, 4);
  }
}

function drawObstacle(o) {
  const top = o.y - o.h;
  ctx.fillStyle = o.kind === 'critical' ? critColor : bugColor;
  ctx.fillRect(o.x + 3, top, o.w - 6, o.h);            // body
  ctx.fillStyle = ink;
  for (let i = 0; i < 3; i++) {                        // legs
    ctx.fillRect(o.x, top + 4 + i * (o.h / 3.5), 3, 2);
    ctx.fillRect(o.x + o.w - 3, top + 4 + i * (o.h / 3.5), 3, 2);
  }
  ctx.fillRect(o.x + o.w / 2 - 4, top + 3, 2, 2);      // eyes
  ctx.fillRect(o.x + o.w / 2 + 2, top + 3, 2, 2);
}

function draw() {
  ctx.clearRect(0, 0, WORLD_W, canvas.height);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 1);
  ctx.lineTo(WORLD_W, GROUND_Y + 1);
  ctx.stroke();
  ctx.fillStyle = ink;                                  // dashes on the ground to show motion
  for (let x = -groundOffset; x < WORLD_W; x += 24) ctx.fillRect(x, GROUND_Y + 8, 8, 2);
  obstacles.forEach(drawObstacle);
  drawRunner(runner);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
