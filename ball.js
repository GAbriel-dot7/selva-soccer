export class Ball {
  constructor(x, y, radius = 20) {
    this.x = x;
    this.y = y;
    this.radius = radius;

    this.velocityX = 0;
    this.velocityY = 0;

    this.maxSpeedX = 10;
    this.maxSpeedY = 10;
    this.damping = 0.97; // Reduz velocidade a cada frame

    this.spawnX = x;
    this.spawnY = y;
  }

  /**
   * Atualiza posição com base em velocidade
   */
  update(timeScale = 1) {
    this.x += this.velocityX * timeScale;
    this.y += this.velocityY * timeScale;

    // Damping (fricção do ar)
    const dampingFactor = Math.pow(this.damping, timeScale);
    this.velocityX *= dampingFactor;
    this.velocityY *= dampingFactor;

    // Parar movimento muito lento
    if (Math.abs(this.velocityX) < 0.01) {
      this.velocityX = 0;
    }
    if (Math.abs(this.velocityY) < 0.01) {
      this.velocityY = 0;
    }

    // Limitar velocidade máxima
    if (Math.abs(this.velocityX) > this.maxSpeedX) {
      this.velocityX = Math.sign(this.velocityX) * this.maxSpeedX;
    }
    if (Math.abs(this.velocityY) > this.maxSpeedY) {
      this.velocityY = Math.sign(this.velocityY) * this.maxSpeedY;
    }
  }

  /**
   * Renderiza a bola no canvas
   */
  render(ctx) {
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Contorno branco para visualizar melhor
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Reseta para posição inicial
   */
  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.velocityX = 0;
    this.velocityY = 0;
  }
}
