import { Player } from "./player.js";
import { Ball } from "./ball.js";
import {
  GRAVITY,
  applyGravity,
  ballGroundCollision,
  ballPlayerCollision,
  ballWallCollision,
  playerGroundCollision,
  clamp,
} from "./physics.js";

export class Game {
  constructor(canvas, scoreboardElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.scoreboardElement = scoreboardElement;

    this.width = canvas.width;
    this.height = canvas.height;
    this.groundHeight = 80;
    this.groundY = this.height - this.groundHeight;

    // Criar jogadores
    this.player1 = new Player(50, this.groundY - 60, 50, 60, "#ff6b6b");
    this.player2 = new Player(this.width - 100, this.groundY - 60, 50, 60, "#4ecdc4");

    // Criar bola
    this.ball = new Ball(this.width / 2, this.groundY - 140, 20);

    // Placar
    this.score = { left: 0, right: 0 };

    // Áreas de gol
    this.goals = {
      left: { x: 0, width: 40, y: this.groundY - 120, height: 120 },
      right: { x: this.width - 40, width: 40, y: this.groundY - 120, height: 120 },
    };

    this.setWorldSize(window.innerWidth, window.innerHeight);
    this.updateScoreboard();
  }

  setWorldSize(width, height) {
    this.width = Math.max(800, Math.floor(width));
    this.height = Math.max(400, Math.floor(height));

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.groundY = this.height - this.groundHeight;

    this.goals.left = { x: 0, width: 40, y: this.groundY - 120, height: 120 };
    this.goals.right = {
      x: this.width - 40,
      width: 40,
      y: this.groundY - 120,
      height: 120,
    };

    this.resetPositions();
  }

  resetPositions() {
    this.player1.spawnX = 50;
    this.player1.spawnY = this.groundY - this.player1.height;
    this.player2.spawnX = this.width - 100;
    this.player2.spawnY = this.groundY - this.player2.height;
    this.ball.spawnX = this.width / 2;
    this.ball.spawnY = this.groundY - 140;

    this.player1.reset();
    this.player2.reset();
    this.ball.reset();
  }

  /**
   * Atualiza a lógica do jogo (physics tick).
   *
   * We use **fixed-size sub-stepping** to keep the simulation stable even
   * when the browser delivers variable frame deltas (e.g. 60 Hz vs 144 Hz).
   *
   * Algorithm:
   *   stepCount = ceil(deltaMs / 8)          — how many 8 ms micro-steps
   *   stepScale = 1 / stepCount              — fraction of a full frame each
   *                                            micro-step represents
   *
   * Inside each micro-step the order matters:
   *   1. Gravity          — accelerate downward (scaled by stepScale)
   *   2. Position update  — integrate velocity → position (Euler step)
   *   3. World bounds     — clamp players inside the field
   *   4. Ground / wall    — resolve environment collisions first
   *   5. Ball vs players  — resolve entity collisions last so the ball
   *                         separates cleanly
   *
   * After all micro-steps, goal detection runs once per frame.
   */
  update(deltaMs = 16.67) {
    // Determine the number of sub-steps.  More sub-steps = more accurate at
    // the cost of CPU.  Clamped to [1, 6] to avoid runaway loops on lag spikes.
    const stepCount = Math.max(1, Math.min(6, Math.ceil(deltaMs / 8)));
    const stepScale = 1 / stepCount;

    for (let i = 0; i < stepCount; i += 1) {
      // --- 1. Apply gravity (v_y += g * dt) scaled to sub-step size ---
      applyGravity(this.player1, GRAVITY * stepScale);
      applyGravity(this.player2, GRAVITY * stepScale);
      applyGravity(this.ball, GRAVITY * stepScale);

      // --- 2. Integrate positions (x += v_x * dt, y += v_y * dt) ---
      this.player1.update(stepScale);
      this.player2.update(stepScale);
      this.ball.update(stepScale);

      // --- 3. Constrain players to world boundaries ---
      this.constrainToWorld();

      // --- 4. Environment collisions (ground & walls) ---
      playerGroundCollision(this.player1, this.groundY);
      playerGroundCollision(this.player2, this.groundY);
      ballGroundCollision(this.ball, this.groundY);
      ballWallCollision(this.ball, this.width);

      // --- 5. Entity collisions (ball ↔ players) ---
      ballPlayerCollision(this.ball, this.player1);
      ballPlayerCollision(this.ball, this.player2);
    }

    // Goal detection runs once per visual frame (not per sub-step)
    this.checkGoals();
  }

  /**
   * Processa input do jogador
   */
  processInput(keys) {
    this.player1.processInput(keys);
  }

  /**
   * Processa input do jogador 2
   */
  processInput2(keys) {
    this.player2.processInput(keys);
  }

  /**
   * Limita posição dos objetos ao mundo
   */
  constrainToWorld() {
    // Ambos os players podem andar pelo campo todo
    this.player1.x = clamp(this.player1.x, 0, this.width - this.player1.width);
    this.player2.x = clamp(this.player2.x, 0, this.width - this.player2.width);
  }

  /**
   * Detecta se algum gol foi marcado
   */
  checkGoals() {
    // Gol na esquerda (ponto para o direito)
    if (
      this.ball.x - this.ball.radius <= this.goals.left.x &&
      this.ball.y > this.goals.left.y &&
      this.ball.y < this.goals.left.y + this.goals.left.height
    ) {
      this.score.right++;
      this.resetAfterGoal();
      return;
    }

    // Gol na direita (ponto para o esquerdo)
    if (
      this.ball.x + this.ball.radius >= this.goals.right.x &&
      this.ball.y > this.goals.right.y &&
      this.ball.y < this.goals.right.y + this.goals.right.height
    ) {
      this.score.left++;
      this.resetAfterGoal();
      return;
    }
  }

  /**
   * Reseta jogo após gol
   */
  resetAfterGoal() {
    this.resetPositions();
    this.updateScoreboard();
  }

  /**
   * Atualiza placar na tela
   */
  updateScoreboard() {
    this.scoreboardElement.textContent = `${this.score.left} x ${this.score.right}`;
  }

  /**
   * Renderiza o jogo
   */
  render() {
    // Limpar canvas
    this.ctx.fillStyle = "#87ceeb";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Gradiente de céu
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGradient.addColorStop(0, "#87ceeb");
    skyGradient.addColorStop(1, "#e0f6ff");
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.width, this.groundY);

    // Chão
    this.ctx.fillStyle = "#2d5016";
    this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

    // Linha do meio
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2, this.groundY);
    this.ctx.lineTo(this.width / 2, this.height);
    this.ctx.stroke();

    // Áreas de gol
    this.ctx.strokeStyle = "#ffff00";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      this.goals.left.x,
      this.goals.left.y,
      this.goals.left.width,
      this.goals.left.height
    );
    this.ctx.strokeRect(
      this.goals.right.x,
      this.goals.right.y,
      this.goals.right.width,
      this.goals.right.height
    );

    // Renderizar objetos
    this.player1.render(this.ctx);
    this.player2.render(this.ctx);
    this.ball.render(this.ctx);

    // Instruções
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    this.ctx.font = "12px Arial";
    this.ctx.fillText("P1: A/D + W", 10, 20);
    this.ctx.fillText("P2: ←↑→ + ↑", this.width - 100, 20);
  }
}
