export default class KeyboardInput {
    constructor() {
        this.keys = new Set();

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleWindowBlur = this.handleWindowBlur.bind(this);

        this.addEventListeners();
    }

    addEventListeners() {
        window.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("keyup", this.handleKeyUp);
        window.addEventListener("blur", this.handleWindowBlur);
    }

    handleKeyDown(event) {
        this.keys.add(event.code);

        const gameKeys = [
            "KeyW",
            "KeyA",
            "KeyS",
            "KeyD",
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "Space",
        ];

        if (gameKeys.includes(event.code)) {
            event.preventDefault();
        }
    }

    handleKeyUp(event) {
        this.keys.delete(event.code);
    }

    handleWindowBlur() {
        this.keys.clear();
    }

    isPressed(...codes) {
        return codes.some((code) => this.keys.has(code));
    }

    destroy() {
        window.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("keyup", this.handleKeyUp);
        window.removeEventListener("blur", this.handleWindowBlur);

        this.keys.clear();
    }
}