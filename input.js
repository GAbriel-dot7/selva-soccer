export class InputController {
  constructor() {
    // Player 1 (WASD)
    this.player1 = {
      left: false,
      right: false,
      jump: false,
    };

    // Player 2 (Setas)
    this.player2 = {
      left: false,
      right: false,
      jump: false,
    };

    this.setupListeners();
  }

  /**
   * Configura listeners de teclado
   */
  setupListeners() {
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));
  }

  /**
   * Processa tecla pressionada
   */
  onKeyDown(event) {
    const key = event.key.toLowerCase();

    // Player 1 (WASD)
    if (key === "a") this.player1.left = true;
    if (key === "d") this.player1.right = true;
    if (key === "w") {
      this.player1.jump = true;
      event.preventDefault();
    }

    // Player 2 (Setas)
    if (event.key === "ArrowLeft") this.player2.left = true;
    if (event.key === "ArrowRight") this.player2.right = true;
    if (event.key === "ArrowUp") {
      this.player2.jump = true;
      event.preventDefault();
    }
  }

  /**
   * Processa tecla solta
   */
  onKeyUp(event) {
    const key = event.key.toLowerCase();

    // Player 1 (WASD)
    if (key === "a") this.player1.left = false;
    if (key === "d") this.player1.right = false;
    if (key === "w") {
      this.player1.jump = false;
      event.preventDefault();
    }

    // Player 2 (Setas)
    if (event.key === "ArrowLeft") this.player2.left = false;
    if (event.key === "ArrowRight") this.player2.right = false;
    if (event.key === "ArrowUp") {
      this.player2.jump = false;
      event.preventDefault();
    }
  }
}
