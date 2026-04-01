import { Game } from "./game.js";
import { InputController } from "./input.js";

const canvas = document.getElementById("gameCanvas");
const scoreboard = document.getElementById("scoreboard");

if (!canvas || !scoreboard) {
  throw new Error("Elements not found");
}

const game = new Game(canvas, scoreboard);
const input = new InputController();

function resizeGame() {
  game.setWorldSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", resizeGame);
resizeGame();

let lastTime = performance.now();

/**
 * Game loop principal
 */
function gameLoop(now) {
  const deltaMs = Math.min(33.33, now - lastTime || 16.67);
  lastTime = now;

  // Processar input para Player 1 (WASD)
  game.processInput(input.player1);

  // Processar input para Player 2 (Setas)
  game.processInput2(input.player2);

  // Atualizar física e lógica
  game.update(deltaMs);

  // Renderizar
  game.render();

  requestAnimationFrame(gameLoop);
}

// Iniciar loop
requestAnimationFrame(gameLoop);
