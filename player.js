export class Player {
  constructor(x, y, width = 50, height = 60, color = "#ff6b6b") {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;

    this.velocityX = 0;
    this.velocityY = 0;

    // -----------------------------------------------------------------------
    // Movement tuning constants
    // -----------------------------------------------------------------------

    /**
     * Horizontal acceleration added per input frame.
     * Formula: v_x += speed  (clamped to ±maxSpeedX)
     * Higher = snappier response to key presses.
     */
    this.speed = 5.0;

    /**
     * Maximum horizontal speed (pixels / frame at timeScale = 1).
     * Acts as a hard clamp: |v_x| ≤ maxSpeedX.
     */
    this.maxSpeedX = 7;

    /**
     * Impulse applied upward when the player jumps.
     * Formula: v_y = -jumpForce  (negative = upward in screen coords)
     * 13 gives a slightly higher arc for more aerial play.
     */
    this.jumpForce = 13;

    /**
     * Deceleration multiplier applied each frame when NO horizontal input
     * is held.
     * Formula: v_x *= friction  (each idle frame)
     * Lower values = player stops faster (tighter control).
     * 0.78 makes the player feel snappy and responsive on release.
     */
    this.friction = 0.78;

    /**
     * Friction multiplier used while the player is airborne (no ground
     * contact). Slightly higher than ground friction so the player retains
     * more momentum in the air — feels more natural for aerial kicks.
     * Formula: v_x *= airFriction  (each airborne frame without input)
     */
    this.airFriction = 0.92;

    this.isGrounded = false;
    this.spawnX = x;
    this.spawnY = y;
  }

  /**
   * Processes keyboard input and updates horizontal velocity + jump.
   *
   * Acceleration model (per frame):
   *   - Key held:  v_x = clamp(v_x ± speed, -maxSpeedX, maxSpeedX)
   *   - No key:    v_x *= friction   (ground) or airFriction (air)
   *   - Dead-zone: if |v_x| < 0.1 → v_x = 0  (prevent drift)
   *
   * Jump: instantaneous impulse v_y = -jumpForce, only while grounded.
   */
  processInput(keys) {
    if (keys.left) {
      // Accelerate left, clamped to -maxSpeedX
      this.velocityX = Math.max(this.velocityX - this.speed, -this.maxSpeedX);
    } else if (keys.right) {
      // Accelerate right, clamped to +maxSpeedX
      this.velocityX = Math.min(this.velocityX + this.speed, this.maxSpeedX);
    } else {
      // No horizontal input — apply friction to decelerate.
      // Use lighter air friction when airborne so the player drifts naturally.
      const frictionFactor = this.isGrounded ? this.friction : this.airFriction;
      this.velocityX *= frictionFactor;

      // Dead-zone: snap to zero to prevent imperceptible sliding
      if (Math.abs(this.velocityX) < 0.1) {
        this.velocityX = 0;
      }
    }

    // Jump — apply instantaneous upward impulse (only when grounded)
    if (keys.jump && this.isGrounded) {
      this.velocityY = -this.jumpForce;
      this.isGrounded = false;
    }
  }

  /**
   * Integrates velocity into position (Euler step).
   *
   * Formula:
   *   x(t+dt) = x(t) + v_x * dt
   *   y(t+dt) = y(t) + v_y * dt
   *
   * `timeScale` is the sub-step fraction (1/stepCount) so that the total
   * displacement per frame stays consistent regardless of sub-step count.
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
