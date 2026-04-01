export class Player {
  constructor(x, y, width = 50, height = 60, color = "#ff6b6b") {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;

    this.velocityX = 0;
    this.velocityY = 0;

    this.speed = 4.5; // Aceleração ao se mover
    this.maxSpeedX = 6; // Velocidade máxima horizontal
    this.jumpForce = 12; // Força do pulo
    this.friction = 0.82; // Fricção do movimento horizontal

    this.isGrounded = false;
    this.spawnX = x;
    this.spawnY = y;
  }

  /**
   * Processa input do teclado
   */
  processInput(keys) {
    if (keys.left) {
      this.velocityX = Math.max(this.velocityX - this.speed, -this.maxSpeedX);
    } else if (keys.right) {
      this.velocityX = Math.min(this.velocityX + this.speed, this.maxSpeedX);
    } else {
      // Freio natural quando não há input
      this.velocityX *= this.friction;
      if (Math.abs(this.velocityX) < 0.1) {
        this.velocityX = 0;
      }
    }

    // Pular
    if (keys.jump && this.isGrounded) {
      this.velocityY = -this.jumpForce;
      this.isGrounded = false;
    }
  }

  /**
   * Atualiza posição com base em velocidade
   */
  update(timeScale = 1) {
    this.x += this.velocityX * timeScale;
    this.y += this.velocityY * timeScale;
  }

  /**
   * Renderiza o player no canvas
   */
  render(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Olho para indicar direção
    ctx.fillStyle = "#000";
    const eyeSize = 5;
    if (this.velocityX > 0) {
      ctx.fillRect(this.x + this.width - 15, this.y + 15, eyeSize, eyeSize);
    } else {
      ctx.fillRect(this.x + 10, this.y + 15, eyeSize, eyeSize);
    }
  }

  /**
   * Reseta para posição inicial
   */
  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isGrounded = false;
  }
}
