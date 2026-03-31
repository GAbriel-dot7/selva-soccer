import { clampValue } from "./physics.js";

export class Ball {
  constructor({ x, y, radius = 16 }) {
    this.spawn = { x, y };
    this.x = x;
    this.y = y;
    this.radius = radius;

    this.velocityX = 0;
    this.velocityY = 0;
  }

  reset() {
    this.x = this.spawn.x;
    this.y = this.spawn.y;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  integrate() {
    this.x += this.velocityX;
    this.y += this.velocityY;
  }

  applyDamping() {
    this.velocityX *= 0.98;
    this.velocityY *= 0.999;

    if (Math.abs(this.velocityX) < 0.01) this.velocityX = 0;
    if (Math.abs(this.velocityY) < 0.01) this.velocityY = 0;
  }

  clampSpeed(maxX = 12, maxY = 16) {
    this.velocityX = clampValue(this.velocityX, -maxX, maxX);
    this.velocityY = clampValue(this.velocityY, -maxY, maxY);
  }

  render(ctx) {
    const radial = ctx.createRadialGradient(
      this.x - this.radius * 0.35,
      this.y - this.radius * 0.35,
      this.radius * 0.2,
      this.x,
      this.y,
      this.radius
    );
    radial.addColorStop(0, "#ffffff");
    radial.addColorStop(1, "#e5e7eb");

    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#bfc5d1";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#2f3747";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.5, this.y + this.radius * 0.1, this.radius * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x + this.radius * 0.45, this.y + this.radius * 0.15, this.radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
}
