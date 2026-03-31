export const GRAVITY = 0.5;

export function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function applyGravity(entity, gravity = GRAVITY) {
  entity.velocityY += gravity;
}

export function resolvePlayerGroundCollision(player, groundY) {
  const playerBottom = player.y + player.height;

  if (playerBottom >= groundY) {
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.onGround = true;
    return;
  }

  player.onGround = false;
}

export function resolveBallGroundCollision(ball, groundY) {
  const ballBottom = ball.y + ball.radius;

  if (ballBottom >= groundY) {
    ball.y = groundY - ball.radius;

    const dynamicBounce = Math.abs(ball.velocityY) > 6 ? -0.8 : -0.68;
    ball.velocityY *= dynamicBounce;

    if (Math.abs(ball.velocityY) < 0.45) {
      ball.velocityY = 0;
    }
  }
}

export function resolveBallWallCollision(ball, worldWidth) {
  if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius;
    ball.velocityX *= -0.8;
  }

  if (ball.x + ball.radius >= worldWidth) {
    ball.x = worldWidth - ball.radius;
    ball.velocityX *= -0.8;
  }
}

export function detectCircleRectCollision(ball, rect) {
  const closestX = clampValue(ball.x, rect.x, rect.x + rect.width);
  const closestY = clampValue(ball.y, rect.y, rect.y + rect.height);

  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  const distanceSq = dx * dx + dy * dy;

  if (distanceSq > ball.radius * ball.radius) {
    return null;
  }

  const distance = Math.sqrt(distanceSq) || 0.0001;
  const overlap = ball.radius - distance;

  return {
    dx,
    dy,
    distance,
    overlap,
  };
}

export function resolveBallPlayerCollision(ball, player) {
  const hit = detectCircleRectCollision(ball, player);
  if (!hit) return;

  // Resolve penetração primeiro para evitar "grudar" entre bola e player.
  const normalX = hit.dx / hit.distance;
  const normalY = hit.dy / hit.distance;

  ball.x += normalX * (hit.overlap + 0.5);
  ball.y += normalY * (hit.overlap + 0.5);

  const relativeVelocityX = ball.velocityX - player.velocityX;
  const relativeVelocityY = ball.velocityY - player.velocityY;
  const velocityAlongNormal = relativeVelocityX * normalX + relativeVelocityY * normalY;

  if (velocityAlongNormal < 0) {
    const restitution = 0.82;
    const impulse = -(1 + restitution) * velocityAlongNormal;

    ball.velocityX += impulse * normalX;
    ball.velocityY += impulse * normalY;
  }

  ball.velocityX += player.velocityX * 0.22;

  if (!player.onGround) {
    ball.velocityX += player.velocityX * 0.12 + normalX * 0.45;
    ball.velocityY -= 0.5;
  }

  if (Math.abs(ball.velocityX) < 0.2) {
    const direction = ball.x >= player.x + player.width / 2 ? 1 : -1;
    ball.velocityX += direction * 0.6;
  }
}

export function resolvePlayerPlayerCollision(playerA, playerB) {
  const overlapX =
    Math.min(playerA.x + playerA.width, playerB.x + playerB.width) -
    Math.max(playerA.x, playerB.x);

  const overlapY =
    Math.min(playerA.y + playerA.height, playerB.y + playerB.height) -
    Math.max(playerA.y, playerB.y);

  if (overlapX <= 0 || overlapY <= 0) {
    return;
  }

  if (overlapX < overlapY) {
    const push = overlapX / 2;

    if (playerA.x < playerB.x) {
      playerA.x -= push;
      playerB.x += push;
    } else {
      playerA.x += push;
      playerB.x -= push;
    }

    const averageVelocity = (playerA.velocityX + playerB.velocityX) / 2;
    playerA.velocityX = averageVelocity;
    playerB.velocityX = averageVelocity;
    return;
  }

  const push = overlapY / 2;
  if (playerA.y < playerB.y) {
    playerA.y -= push;
    playerB.y += push;
    playerA.velocityY = Math.min(playerA.velocityY, 0);
    playerB.velocityY = Math.max(playerB.velocityY, 0);
  } else {
    playerA.y += push;
    playerB.y -= push;
    playerA.velocityY = Math.max(playerA.velocityY, 0);
    playerB.velocityY = Math.min(playerB.velocityY, 0);
  }
}
