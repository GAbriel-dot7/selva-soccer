import { Game } from "./game.js";

const canvas = document.getElementById("gameCanvas");
const scoreboard = document.getElementById("scoreboard");

if (!canvas || !scoreboard) {
  throw new Error("Elementos principais do jogo não encontrados.");
}

const game = new Game(canvas, scoreboard);

let lastTime = performance.now();

function gameLoop(now) {
  const deltaMs = Math.min(33, now - lastTime || 16.67);
  lastTime = now;

  game.update(deltaMs);
  game.render();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
