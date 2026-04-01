// Constantes de física
export const GRAVITY = 0.6;
export const GROUND_Y = 320; // Altura do chão (canvas 400px - altura do chão 80px)
export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 400;

/**
 * Aplica gravidade a uma entidade
 */
export function applyGravity(entity, gravity = GRAVITY) {
  entity.velocityY += gravity;
}

/**
 * Limita um valor entre mín e máx
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Detecta colisão entre círculo (bola) e retângulo (player)
 */
export function circleRectCollision(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);

  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distanceSq = dx * dx + dy * dy;
  const radiusSq = circle.radius * circle.radius;

  if (distanceSq > radiusSq) {
    return null; // Sem colisão
  }

  // Centro do circulo dentro do retangulo: definir normal/overlap manualmente.
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

  const distance = Math.sqrt(distanceSq) || 0.001;
  const overlap = circle.radius - distance;

  return {
    dx,
    dy,
    distance,
    overlap,
    normalX: dx / distance,
    normalY: dy / distance,
  };
}

/**
 * Resolve colisão entre bola e chão
 */
export function ballGroundCollision(ball, groundY) {
  const ballBottom = ball.y + ball.radius;

  if (ballBottom >= groundY) {
    ball.y = groundY - ball.radius;
    ball.velocityY *= -0.99; // Bounce bem mais alto

    // Amortecimento horizontal
    if (Math.abs(ball.velocityY) < 1) {
      ball.velocityY = 0;
    }
  }
}

/**
 * Resolve colisão entre bola e player
 */
export function ballPlayerCollision(ball, player) {
  const collision = circleRectCollision(ball, player);
  if (!collision) return;

  // Afastar a bola para evitar grudar
  ball.x += collision.normalX * (collision.overlap + 1);
  ball.y += collision.normalY * (collision.overlap + 1);

  // Componente de velocidade relativa ao longo da normal
  const relVelX = ball.velocityX - player.velocityX;
  const relVelY = ball.velocityY - player.velocityY;
  const velAlongNormal = relVelX * collision.normalX + relVelY * collision.normalY;

  // Só aplicar impulso se a bola está se aproximando
  if (velAlongNormal < 0) {
    const restitution = 1.1; // Elasticidade
    const impulse = -(1 + restitution) * velAlongNormal;

    ball.velocityX += impulse * collision.normalX;
    ball.velocityY += impulse * collision.normalY;
  }

  // Garante que a bola nao continue entrando no player no mesmo frame.
  const postRelVelX = ball.velocityX - player.velocityX;
  const postRelVelY = ball.velocityY - player.velocityY;
  const postVelAlongNormal = postRelVelX * collision.normalX + postRelVelY * collision.normalY;
  if (postVelAlongNormal < 0) {
    ball.velocityX -= postVelAlongNormal * collision.normalX;
    ball.velocityY -= postVelAlongNormal * collision.normalY;
  }

  // Transferência de velocidade horizontal do player para bola
  ball.velocityX += player.velocityX * 0.3;
}

/**
 * Resolve colisão entre player e chão
 */
export function playerGroundCollision(player, groundY) {
  const playerBottom = player.y + player.height;

  if (playerBottom >= groundY) {
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.isGrounded = true;
    return;
  }

  player.isGrounded = false;
}

/**
 * Resolve colisão entre bola e paredes
 */
export function ballWallCollision(ball, worldWidth) {
  if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius;
    ball.velocityX *= -0.85;
  }

  if (ball.x + ball.radius >= worldWidth) {
    ball.x = worldWidth - ball.radius;
    ball.velocityX *= -0.85;
  }
}
