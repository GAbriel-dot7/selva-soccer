export class Ball {
  constructor(x, y, radius = 20) {
    this.x = x;
    this.y = y;
    this.radius = radius;

    this.velocityX = 0;
    this.velocityY = 0;

    // -----------------------------------------------------------------------
    // Ball tuning constants
    // -----------------------------------------------------------------------

    /**
     * Hard speed caps (pixels / frame at timeScale = 1).
     * Prevents the ball from flying off-screen after extreme collisions.
     * Formula: |v| = min(|v|, maxSpeed)
     * Raised to 12 / 15 so powerful kicks feel impactful.
     */
    this.maxSpeedX = 12;
    this.maxSpeedY = 15;

    /**
     * Air-drag damping factor applied every frame.
     *
     * Formula (frame-rate independent):
     *   effectiveDamping = damping ^ timeScale
     *   v_x *= effectiveDamping
     *   v_y *= effectiveDamping
     *
     * Using Math.pow ensures the total energy loss over one second is the
     * same whether the game runs at 30 or 144 FPS.
     *
     * 0.993 is very light drag — the ball carries across the field nicely
     * but still eventually comes to rest.
     */
    this.damping = 0.993;

    this.spawnX = x;
    this.spawnY = y;
  }

  /**
   * Integrates velocity → position and applies air drag + speed limits.
   *
   * Order of operations:
   *   1. Euler integration:  pos += vel * dt
   *   2. Air drag:           vel *= damping^dt   (frame-rate independent)
   *   3. Dead-zone clamp:    if |vel| < 0.01 → vel = 0
   *   4. Speed cap:          |vel| = min(|vel|, maxSpeed)
   */
  update(timeScale = 1) {
    // 1. Euler position integration
    this.x += this.velocityX * timeScale;
    this.y += this.velocityY * timeScale;

    // 2. Frame-rate-independent air drag: damping^dt
    const dampingFactor = Math.pow(this.damping, timeScale);
    this.velocityX *= dampingFactor;
    this.velocityY *= dampingFactor;

    // 3. Dead-zone — zero out negligible velocities to avoid floating-point creep
    if (Math.abs(this.velocityX) < 0.01) {
      this.velocityX = 0;
    }
    if (Math.abs(this.velocityY) < 0.01) {
      this.velocityY = 0;
    }

    // 4. Hard speed cap — prevent extreme velocities from escaping the field
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
