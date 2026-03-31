export class InputController {
  constructor() {
    this.keysP1 = {
      left: false,
      right: false,
      jump: false,
      jumpPressed: false,
    };

    this.keysP2 = {
      left: false,
      right: false,
      jump: false,
      jumpPressed: false,
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  onKeyDown(event) {
    const key = event.key.toLowerCase();

    if (key === "a") this.keysP1.left = true;
    if (key === "d") this.keysP1.right = true;
    if (key === "w") {
      if (!this.keysP1.jump) this.keysP1.jumpPressed = true;
      this.keysP1.jump = true;
    }

    if (event.key === "ArrowLeft") this.keysP2.left = true;
    if (event.key === "ArrowRight") this.keysP2.right = true;
    if (event.key === "ArrowUp") {
      if (!this.keysP2.jump) this.keysP2.jumpPressed = true;
      this.keysP2.jump = true;
    }

    if (["ArrowLeft", "ArrowRight", "ArrowUp", "a", "d", "w", "W"].includes(event.key)) {
      event.preventDefault();
    }
  }

  onKeyUp(event) {
    const key = event.key.toLowerCase();

    if (key === "a") this.keysP1.left = false;
    if (key === "d") this.keysP1.right = false;
    if (key === "w") this.keysP1.jump = false;

    if (event.key === "ArrowLeft") this.keysP2.left = false;
    if (event.key === "ArrowRight") this.keysP2.right = false;
    if (event.key === "ArrowUp") this.keysP2.jump = false;
  }

  endFrame() {
    this.keysP1.jumpPressed = false;
    this.keysP2.jumpPressed = false;
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}
