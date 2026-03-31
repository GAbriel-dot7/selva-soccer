import { Player } from "./player.js";
import { Ball } from "./ball.js";
import { InputController } from "./input.js";
import {
  GRAVITY,
  applyGravity,
  resolvePlayerGroundCollision,
  resolveBallGroundCollision,
  resolveBallWallCollision,
  resolveBallPlayerCollision,
  resolvePlayerPlayerCollision,
} from "./physics.js";

export class Game {
  constructor(canvas, scoreboardElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.scoreboardElement = scoreboardElement;

    this.width = canvas.width;
    this.height = canvas.height;

    this.groundHeight = 44;
    this.groundY = this.height - this.groundHeight;

    this.goals = {
      left: {
        x: 0,
        width: 18,
        y: this.groundY - 96,
        height: 96,
      },
      right: {
        x: this.width - 18,
        width: 18,
        y: this.groundY - 96,
        height: 96,
      },
    };

    this.input = new InputController();

    this.player = new Player({
      x: 120,
      y: this.groundY - 70,
      width: 42,
      height: 70,
      color: "#f08a24",
      species: "rabbit",
    });

    this.player2 = new Player({
      x: this.width - 162,
      y: this.groundY - 70,
      width: 42,
      height: 70,
      color: "#4d9cff",
      species: "mouse",
    });

    this.ball = new Ball({
      x: this.width / 2,
      y: this.groundY - 130,
      radius: 16,
    });

    this.score = {
      left: 0,
      right: 0,
    };

    this.physicsSubsteps = 3;
    this.kickoffDurationMs = 900;
    this.kickoffTimerMs = this.kickoffDurationMs;
    this.matchDurationMs = 120000;
    this.remainingTimeMs = this.matchDurationMs;
    this.targetScore = 5;
    this.gameOver = false;
    this.winnerMessage = "";

    this.updateScoreboard();
  }

  update(deltaMs = 16.67) {
    this.processInput(deltaMs);

    if (this.gameOver) {
      this.input.endFrame();
      this.updateScoreboard();
      return;
    }

    if (this.kickoffTimerMs > 0) {
      this.kickoffTimerMs = Math.max(0, this.kickoffTimerMs - deltaMs);
      this.updatePlayersOnly(deltaMs);
      this.lockBallToCenter();
    } else {
      this.remainingTimeMs = Math.max(0, this.remainingTimeMs - deltaMs);
      this.updatePhysics(deltaMs);
      this.checkGoals();
      this.checkMatchEnd();
    }

    this.input.endFrame();
    this.updateScoreboard();
  }

  processInput(deltaMs) {
    this.player.processInput(this.input.keysP1, deltaMs);
    this.player2.processInput(this.input.keysP2, deltaMs);
  }

  updatePlayersOnly(deltaMs) {
    const stepCount = this.physicsSubsteps;
    const stepGravity = GRAVITY / stepCount;

    for (let index = 0; index < stepCount; index += 1) {
      applyGravity(this.player, stepGravity);
      applyGravity(this.player2, stepGravity);

      this.player.integrate();
      this.player2.integrate();

      this.player.constrainHorizontal(0, this.width / 2 - 10);
      this.player2.constrainHorizontal(this.width / 2 + 10, this.width);

      resolvePlayerGroundCollision(this.player, this.groundY);
      resolvePlayerGroundCollision(this.player2, this.groundY);
    }
  }

  updatePhysics(deltaMs) {
    const stepCount = this.physicsSubsteps;
    const stepGravity = GRAVITY / stepCount;

    for (let index = 0; index < stepCount; index += 1) {
      applyGravity(this.player, stepGravity);
      applyGravity(this.player2, stepGravity);
      applyGravity(this.ball, stepGravity);

      this.player.integrate();
      this.player2.integrate();
      this.ball.integrate();

      this.player.constrainHorizontal(0, this.width);
      this.player2.constrainHorizontal(0, this.width);

      resolvePlayerGroundCollision(this.player, this.groundY);
      resolvePlayerGroundCollision(this.player2, this.groundY);
      resolvePlayerPlayerCollision(this.player, this.player2);

      resolveBallGroundCollision(this.ball, this.groundY);
      resolveBallWallCollision(this.ball, this.width);
      resolveBallPlayerCollision(this.ball, this.player);
      resolveBallPlayerCollision(this.ball, this.player2);
    }

    this.ball.applyDamping();
    this.ball.clampSpeed();
  }

  checkGoals() {
    const inGoalHeight = this.ball.y + this.ball.radius > this.goals.left.y;

    if (
      this.ball.x - this.ball.radius <= this.goals.left.x + this.goals.left.width &&
      inGoalHeight
    ) {
      // Gol na esquerda = ponto para a direita.
      this.score.right += 1;
      this.afterGoal();
      return;
    }

    if (
      this.ball.x + this.ball.radius >= this.goals.right.x &&
      this.ball.y + this.ball.radius > this.goals.right.y
    ) {
      // Gol na direita = ponto para a esquerda.
      this.score.left += 1;
      this.afterGoal();
    }
  }

  afterGoal() {
    this.player.reset();
    this.player2.reset();
    this.ball.reset();
    this.kickoffTimerMs = this.kickoffDurationMs;
  }

  updateScoreboard() {
    this.scoreboardElement.textContent = `${this.score.left} x ${this.score.right}  |  ${this.formatTime(this.remainingTimeMs)}`;
  }

  checkMatchEnd() {
    if (this.score.left >= this.targetScore) {
      this.gameOver = true;
      this.winnerMessage = "Coelho venceu!";
      return;
    }

    if (this.score.right >= this.targetScore) {
      this.gameOver = true;
      this.winnerMessage = "Rato venceu!";
      return;
    }

    if (this.remainingTimeMs <= 0) {
      this.gameOver = true;

      if (this.score.left > this.score.right) {
        this.winnerMessage = "Tempo esgotado: Coelho venceu!";
      } else if (this.score.right > this.score.left) {
        this.winnerMessage = "Tempo esgotado: Rato venceu!";
      } else {
        this.winnerMessage = "Tempo esgotado: Empate!";
      }
    }
  }

  lockBallToCenter() {
    this.ball.x = this.width / 2;
    this.ball.y = this.groundY - 130;
    this.ball.velocityX = 0;
    this.ball.velocityY = 0;
  }

  formatTime(timeMs) {
    const totalSeconds = Math.ceil(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const safeMinutes = String(Math.max(0, minutes)).padStart(2, "0");
    const safeSeconds = String(Math.max(0, seconds)).padStart(2, "0");

    return `${safeMinutes}:${safeSeconds}`;
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawBackground();
    this.drawPitch();
    this.drawGoals();
    this.player.render(this.ctx);
    this.player2.render(this.ctx);
    this.ball.render(this.ctx);
    this.drawCenterBarrierDuringKickoff();
    this.drawOverlay();
  }

  drawBackground() {
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGradient.addColorStop(0, "#4cb9ff");
    skyGradient.addColorStop(1, "#7dd3ff");
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.width, this.groundY);
  }

  drawPitch() {
    this.ctx.fillStyle = "#2c8c3f";
    this.ctx.fillRect(0, this.groundY, this.width, this.groundHeight);

    this.ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    for (let column = 0; column < 10; column += 1) {
      if (column % 2 === 0) {
        this.ctx.fillRect(column * 80, this.groundY, 80, this.groundHeight);
      }
    }

    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundY);
    this.ctx.lineTo(this.width, this.groundY);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2, this.groundY - 56);
    this.ctx.lineTo(this.width / 2, this.groundY);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(this.width / 2, this.groundY - 24, 22, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  drawGoals() {
    this.ctx.fillStyle = "#f0f4ff";

    this.ctx.fillRect(
      this.goals.left.x,
      this.goals.left.y,
      this.goals.left.width,
      this.goals.left.height
    );

    this.ctx.fillRect(
      this.goals.right.x,
      this.goals.right.y,
      this.goals.right.width,
      this.goals.right.height
    );

    this.ctx.strokeStyle = "rgba(70, 92, 130, 0.35)";
    this.ctx.lineWidth = 1;

    for (let index = 0; index <= 8; index += 1) {
      const y = this.goals.left.y + index * 12;
      this.ctx.beginPath();
      this.ctx.moveTo(this.goals.left.x, y);
      this.ctx.lineTo(this.goals.left.x + this.goals.left.width, y);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(this.goals.right.x, y);
      this.ctx.lineTo(this.goals.right.x + this.goals.right.width, y);
      this.ctx.stroke();
    }
  }

  drawCenterBarrierDuringKickoff() {
    if (this.kickoffTimerMs <= 0 || this.gameOver) {
      return;
    }

    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2, this.groundY - 72);
    this.ctx.lineTo(this.width / 2, this.groundY);
    this.ctx.stroke();
  }

  drawOverlay() {
    if (this.kickoffTimerMs > 0 && !this.gameOver) {
      const countdown = Math.max(1, Math.ceil(this.kickoffTimerMs / 300));
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      this.ctx.fillRect(this.width / 2 - 58, 20, 116, 30);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 18px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(`Kickoff ${countdown}`, this.width / 2, 42);
    }

    if (this.gameOver) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 30px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(this.winnerMessage, this.width / 2, this.height / 2 - 8);
      this.ctx.font = "16px Arial";
      this.ctx.fillText("Vitória por 5 gols ou por tempo (2:00)", this.width / 2, this.height / 2 + 24);
    }
  }
}
