import { clampValue } from "./physics.js";

export class Player {
  constructor({ x, y, width = 42, height = 70, color = "#f08a24", species = "rabbit" }) {
    this.spawn = { x, y };
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.velocityX = 0;
    this.velocityY = 0;

    this.speed = 0.9;
    this.maxSpeedX = 7;
    this.jumpForce = 12;
    this.color = color;
    this.species = species;

    this.onGround = false;
    this.facing = 1;
    this.jumpBufferMs = 0;
  }

  reset() {
    this.x = this.spawn.x;
    this.y = this.spawn.y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.onGround = false;
    this.jumpBufferMs = 0;
  }

  processInput(keys, deltaMs = 16.67) {
    if (keys.left) {
      this.velocityX -= this.speed;
      this.facing = -1;
    }

    if (keys.right) {
      this.velocityX += this.speed;
      this.facing = 1;
    }

    if (!keys.left && !keys.right) {
      this.velocityX *= 0.8;
      if (Math.abs(this.velocityX) < 0.03) {
        this.velocityX = 0;
      }
    }

    if (keys.jumpPressed) {
      this.jumpBufferMs = 120;
    }

    if (this.jumpBufferMs > 0) {
      this.jumpBufferMs -= deltaMs;
    }

    if (this.onGround && this.jumpBufferMs > 0) {
      this.velocityY = -this.jumpForce;
      this.onGround = false;
      this.jumpBufferMs = 0;
    }

    this.velocityX = clampValue(this.velocityX, -this.maxSpeedX, this.maxSpeedX);
  }

  integrate() {
    this.x += this.velocityX;
    this.y += this.velocityY;
  }

  constrainHorizontal(minX, maxX) {
    if (this.x < minX) {
      this.x = minX;
      this.velocityX = 0;
    }

    const right = this.x + this.width;
    if (right > maxX) {
      this.x = maxX - this.width;
      this.velocityX = 0;
    }
  }

  render(ctx) {
    ctx.save();

    if (this.facing < 0) {
      ctx.translate(this.x + this.width, this.y);
      ctx.scale(-1, 1);
      if (this.species === "mouse") {
        this.drawMouse(ctx, 0, 0);
      } else {
        this.drawRabbit(ctx, 0, 0);
      }
    } else if (this.species === "mouse") {
      this.drawMouse(ctx, this.x, this.y);
    } else {
      this.drawRabbit(ctx, this.x, this.y);
    }

    ctx.restore();
  }

  drawRabbit(ctx, x, y) {
    const w = this.width;
    const h = this.height;

    ctx.fillStyle = "#9aa1a8";
    ctx.fillRect(x + w * 0.2, y + h * 0.48, w * 0.6, h * 0.38);
    ctx.fillRect(x + w * 0.3, y + h * 0.18, w * 0.42, h * 0.33);

    ctx.fillStyle = "#6f7781";
    ctx.fillRect(x + w * 0.17, y + h * 0.48, w * 0.08, h * 0.32);
    ctx.fillRect(x + w * 0.75, y + h * 0.48, w * 0.08, h * 0.32);

    ctx.fillStyle = "#8e959e";
    ctx.fillRect(x + w * 0.26, y, w * 0.14, h * 0.24);
    ctx.fillRect(x + w * 0.58, y, w * 0.14, h * 0.24);

    ctx.fillStyle = "#eceef2";
    ctx.fillRect(x + w * 0.3, y + h * 0.58, w * 0.4, h * 0.2);
    ctx.fillRect(x + w * 0.39, y + h * 0.32, w * 0.08, h * 0.05);
    ctx.fillRect(x + w * 0.57, y + h * 0.32, w * 0.08, h * 0.05);

    ctx.fillStyle = "#222";
    ctx.fillRect(x + w * 0.44, y + h * 0.38, w * 0.06, h * 0.05);
    ctx.fillRect(x + w * 0.52, y + h * 0.38, w * 0.06, h * 0.05);
    ctx.fillRect(x + w * 0.49, y + h * 0.47, w * 0.06, h * 0.06);
  }

  drawMouse(ctx, x, y) {
    const w = this.width;
    const h = this.height;

    ctx.fillStyle = "#d6d6d6";
    ctx.fillRect(x + w * 0.16, y + h * 0.34, w * 0.62, h * 0.5);
    ctx.fillRect(x + w * 0.46, y + h * 0.14, w * 0.3, h * 0.25);

    ctx.fillStyle = "#c4c4c4";
    ctx.fillRect(x + w * 0.15, y + h * 0.44, w * 0.08, h * 0.28);
    ctx.fillRect(x + w * 0.72, y + h * 0.5, w * 0.08, h * 0.22);

    ctx.fillStyle = "#e6e6e6";
    ctx.fillRect(x + w * 0.48, y + h * 0.03, w * 0.13, h * 0.16);
    ctx.fillRect(x + w * 0.64, y + h * 0.06, w * 0.13, h * 0.16);

    ctx.strokeStyle = "#f0718a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.14, y + h * 0.66);
    ctx.quadraticCurveTo(x - w * 0.25, y + h * 0.8, x - w * 0.05, y + h * 0.93);
    ctx.stroke();

    ctx.fillStyle = "#333";
    ctx.fillRect(x + w * 0.58, y + h * 0.24, w * 0.05, h * 0.05);
    ctx.fillRect(x + w * 0.7, y + h * 0.26, w * 0.04, h * 0.04);

    ctx.fillStyle = "#f0718a";
    ctx.fillRect(x + w * 0.78, y + h * 0.27, w * 0.05, h * 0.04);
  }
}
