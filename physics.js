// =============================================================================
// Physics Constants & Configuration
// =============================================================================

/**
 * GRAVITY — Downward acceleration applied every physics sub-step.
 *
 * Formula: velocityY += GRAVITY * stepScale
 *
 * A value of ~0.65 gives a slightly "floaty" arcade feel while still pulling
 * entities back to the ground quickly enough to feel responsive.
 * Increase for heavier / snappier falls; decrease for a more floaty game.
 */
export const GRAVITY = 0.65;

/**
 * BALL_GROUND_RESTITUTION — Coefficient of restitution for ball–ground bounces.
 *
 * Formula: velocityY_after = velocityY_before * (-BALL_GROUND_RESTITUTION)
 *
 * 1.0 = perfectly elastic (ball bounces back to original height).
 * 0.0 = perfectly inelastic (ball sticks to the ground).
 * 0.6 gives a natural-feeling bounce that loses energy each hop.
 */
const BALL_GROUND_RESTITUTION = 0.6;

/**
 * BALL_GROUND_FRICTION — Horizontal friction applied to the ball while it
 * touches the ground. Simulates rolling resistance.
 *
 * Formula: velocityX *= BALL_GROUND_FRICTION  (each ground-contact frame)
 *
 * Closer to 1.0 = less friction (ice-like).
 * Closer to 0.0 = instant stop.
 */
const BALL_GROUND_FRICTION = 0.94;

/**
 * BALL_WALL_RESTITUTION — How much horizontal speed the ball retains after
 * hitting a side wall.
 *
 * Formula: velocityX_after = velocityX_before * (-BALL_WALL_RESTITUTION)
 */
const BALL_WALL_RESTITUTION = 0.8;

/**
 * BALL_PLAYER_RESTITUTION — Coefficient of restitution for ball–player
 * collisions. Controls how "bouncy" the ball feels when kicked.
 *
 * Formula (impulse-based):
 *   impulse = -(1 + e) * velAlongNormal
 * where e = BALL_PLAYER_RESTITUTION.
 *
 * Values > 1.0 add energy (super-elastic — arcade feel).
 * Values < 1.0 absorb energy (more realistic).
 * 0.9 gives a satisfying kick without making the ball uncontrollably fast.
 */
const BALL_PLAYER_RESTITUTION = 0.9;

/**
 * PLAYER_KICK_TRANSFER — Fraction of the player's horizontal velocity that
 * is added to the ball on contact, on top of the impulse response.
 *
 * Formula: ball.velocityX += player.velocityX * PLAYER_KICK_TRANSFER
 *
 * Higher values reward moving into the ball ("dribbling").
 */
const PLAYER_KICK_TRANSFER = 0.4;

/**
 * BALL_VELOCITY_DEADZONE — Minimum absolute velocity below which the ball's
 * bounce is zeroed out to prevent micro-jittering on the ground.
 */
const BALL_VELOCITY_DEADZONE = 1.2;

// Legacy exports kept for compatibility (used by game.js via import)
export const GROUND_Y = 320;
export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 400;

// =============================================================================
// Utility helpers
// =============================================================================

/**
 * Clamps `value` to the inclusive range [min, max].
 *
 * Formula: result = max(min, min(max, value))
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// =============================================================================
// Gravity
// =============================================================================

/**
 * Applies gravitational acceleration to an entity.
 *
 * Physics: v_y(t+dt) = v_y(t) + g * dt
 * Here `gravity` already contains g*dt for the sub-step.
 */
export function applyGravity(entity, gravity = GRAVITY) {
  entity.velocityY += gravity;
}

// =============================================================================
// Collision detection helpers
// =============================================================================

/**
 * Detects and returns collision info between a circle (ball) and an
 * axis-aligned rectangle (player).
 *
 * Algorithm — Closest-point test:
 *   1. Find the point on the rectangle closest to the circle's centre.
 *   2. Compute the squared distance between that point and the centre.
 *   3. If distance² ≤ radius² → collision detected.
 *
 * Returns null when there is no overlap, or an object:
 *   { dx, dy, distance, overlap, normalX, normalY }
 *
 * The normal always points FROM the rectangle TOWARD the circle centre so
 * that pushing along the normal separates the two shapes.
 */
export function circleRectCollision(circle, rect) {
  // Step 1: Closest point on AABB to circle centre
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);

  // Step 2: Vector from closest point to circle centre
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;

  // Step 3: Squared-distance check (avoids sqrt when possible)
  const distanceSq = dx * dx + dy * dy;
  const radiusSq = circle.radius * circle.radius;

  if (distanceSq > radiusSq) {
    return null; // No collision
  }

  // Edge case: circle centre is INSIDE the rectangle (distanceSq ≈ 0).
  // We pick the shortest escape direction to generate a stable normal.
  if (distanceSq < 0.0001) {
    const distToLeft = circle.x - rect.x;
    const distToRight = rect.x + rect.width - circle.x;
    const distToTop = circle.y - rect.y;
    const distToBottom = rect.y + rect.height - circle.y;
    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    if (minDist === distToLeft) {
      return { dx: -1, dy: 0, distance: 1, overlap: circle.radius + distToLeft, normalX: -1, normalY: 0 };
    }
    if (minDist === distToRight) {
      return { dx: 1, dy: 0, distance: 1, overlap: circle.radius + distToRight, normalX: 1, normalY: 0 };
    }
    if (minDist === distToTop) {
      return { dx: 0, dy: -1, distance: 1, overlap: circle.radius + distToTop, normalX: 0, normalY: -1 };
    }
    return { dx: 0, dy: 1, distance: 1, overlap: circle.radius + distToBottom, normalX: 0, normalY: 1 };
  }

  // Normal case: compute actual distance and penetration depth (overlap).
  const distance = Math.sqrt(distanceSq) || 0.001;
  const overlap = circle.radius - distance;

  return {
    dx,
    dy,
    distance,
    overlap,
    // Unit normal = displacement / |displacement|
    normalX: dx / distance,
    normalY: dy / distance,
  };
}

// =============================================================================
// Collision response — Ball vs Ground
// =============================================================================

/**
 * Resolves ball–ground collision using reflection + restitution.
 *
 * Physics:
 *   1. Position correction: ball.y = groundY - radius  (prevent sinking)
 *   2. Velocity reflection:
 *        v_y' = -v_y * e   (e = BALL_GROUND_RESTITUTION)
 *      This mirrors the vertical component and scales it by the coefficient
 *      of restitution so kinetic energy is lost on each bounce.
 *   3. Horizontal rolling friction:
 *        v_x' = v_x * BALL_GROUND_FRICTION
 *      Simulates energy lost to surface contact while rolling.
 *   4. Dead-zone clamping: if |v_y| drops below BALL_VELOCITY_DEADZONE the
 *      ball is considered "resting" and vertical velocity is zeroed to avoid
 *      jitter.
 */
export function ballGroundCollision(ball, groundY) {
  const ballBottom = ball.y + ball.radius;

  if (ballBottom >= groundY) {
    // 1. Position correction — snap ball above the ground plane
    ball.y = groundY - ball.radius;

    // 2. Reflect vertical velocity and apply restitution loss
    ball.velocityY *= -BALL_GROUND_RESTITUTION;

    // 3. Rolling friction — slow horizontal movement while on the ground
    ball.velocityX *= BALL_GROUND_FRICTION;

    // 4. Dead-zone: stop micro-bouncing when velocity is negligible
    if (Math.abs(ball.velocityY) < BALL_VELOCITY_DEADZONE) {
      ball.velocityY = 0;
    }
  }
}

// =============================================================================
// Collision response — Ball vs Player
// =============================================================================

/**
 * Resolves ball–player collision using impulse-based response.
 *
 * Physics (simplified 2-body impulse for infinite-mass player):
 *
 *   1. Positional separation:
 *        Move the ball out along the collision normal by the overlap amount
 *        plus a small epsilon (1 px) to prevent the ball from sticking inside
 *        the player on the next frame.
 *
 *   2. Relative velocity along the collision normal:
 *        v_rel = (ball.v − player.v) · n
 *      If v_rel ≥ 0 the objects are already separating → skip impulse.
 *
 *   3. Impulse magnitude (1D Newton's law of restitution):
 *        j = -(1 + e) * v_rel
 *      where e = BALL_PLAYER_RESTITUTION.
 *
 *   4. Apply impulse to the ball (player treated as immovable):
 *        ball.v += j * n
 *
 *   5. Safety clamp: after the impulse, re-check relative velocity along the
 *      normal. If the ball is still approaching the player (can happen with
 *      extreme overlaps), remove the remaining approach component to guarantee
 *      separation.
 *
 *   6. Kick transfer: add a fraction of the player's horizontal velocity to
 *      the ball to reward aggressive movement into the ball.
 */
export function ballPlayerCollision(ball, player) {
  const collision = circleRectCollision(ball, player);
  if (!collision) return;

  // 1. Positional separation — push ball out along the collision normal
  ball.x += collision.normalX * (collision.overlap + 1);
  ball.y += collision.normalY * (collision.overlap + 1);

  // 2. Relative velocity projected onto the collision normal
  const relVelX = ball.velocityX - player.velocityX;
  const relVelY = ball.velocityY - player.velocityY;
  const velAlongNormal = relVelX * collision.normalX + relVelY * collision.normalY;

  // Only apply impulse if the ball is approaching (closing velocity < 0)
  if (velAlongNormal < 0) {
    // 3. Impulse magnitude: j = -(1 + e) * v_n
    const impulse = -(1 + BALL_PLAYER_RESTITUTION) * velAlongNormal;

    // 4. Apply impulse (only to ball — player has "infinite mass")
    ball.velocityX += impulse * collision.normalX;
    ball.velocityY += impulse * collision.normalY;
  }

  // 5. Safety clamp — guarantee the ball isn't still moving into the player
  const postRelVelX = ball.velocityX - player.velocityX;
  const postRelVelY = ball.velocityY - player.velocityY;
  const postVelAlongNormal =
    postRelVelX * collision.normalX + postRelVelY * collision.normalY;

  if (postVelAlongNormal < 0) {
    // Remove the remaining approach component along the normal
    ball.velocityX -= postVelAlongNormal * collision.normalX;
    ball.velocityY -= postVelAlongNormal * collision.normalY;
  }

  // 6. Kick transfer — reward the player for running into the ball
  ball.velocityX += player.velocityX * PLAYER_KICK_TRANSFER;
}

// =============================================================================
// Collision response — Player vs Ground
// =============================================================================

/**
 * Resolves player–ground collision.
 *
 * Simple inelastic response:
 *   - Snap the player's feet to the ground plane.
 *   - Zero out vertical velocity (no bounce for players).
 *   - Set the grounded flag so the player can jump again.
 *
 * If the player is above the ground, mark them as airborne.
 */
export function playerGroundCollision(player, groundY) {
  const playerBottom = player.y + player.height;

  if (playerBottom >= groundY) {
    // Snap feet to ground and stop falling
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.isGrounded = true;
    return;
  }

  player.isGrounded = false;
}

// =============================================================================
// Collision response — Ball vs Walls
// =============================================================================

/**
 * Resolves ball–wall collision (left and right boundaries).
 *
 * Physics:
 *   1. Position correction: clamp ball inside the field.
 *   2. Velocity reflection with restitution:
 *        v_x' = -v_x * BALL_WALL_RESTITUTION
 *      The ball loses a fraction of its horizontal speed on each wall hit,
 *      preventing infinite ping-ponging.
 */
export function ballWallCollision(ball, worldWidth) {
  // Left wall
  if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius;
    ball.velocityX *= -BALL_WALL_RESTITUTION;
  }

  // Right wall
  if (ball.x + ball.radius >= worldWidth) {
    ball.x = worldWidth - ball.radius;
    ball.velocityX *= -BALL_WALL_RESTITUTION;
  }
}
