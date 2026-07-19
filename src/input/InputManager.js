import KeyboardInput from "./KeyboardInput";

export default class InputManager {
    constructor() {

        this.keyboard = new KeyboardInput();

        // AI steering from MediaPipe
        this.aiSteering = null;

        this.inputState = {
            throttle: 0,
            brake: 0,
            steering: 0,
            handbrake: false,
        };
    }

    setAISteering(value) {
        this.aiSteering = value;
    }

    clearAISteering() {
        this.aiSteering = null;
    }

    update() {

        const accelerate =
            this.keyboard.isPressed("KeyW", "ArrowUp");

        const brake =
            this.keyboard.isPressed("KeyS", "ArrowDown");

        const steerLeft =
            this.keyboard.isPressed("KeyA", "ArrowLeft");

        const steerRight =
            this.keyboard.isPressed("KeyD", "ArrowRight");

        const handbrake =
            this.keyboard.isPressed("Space");

        this.inputState.throttle =
            accelerate ? 1 : 0;

        this.inputState.brake =
            brake ? 1 : 0;

        //---------------------------------
        // Steering
        //---------------------------------

        if (this.aiSteering !== null) {

            this.inputState.steering =
                this.aiSteering;

        } else {

            if (steerLeft && !steerRight) {

                this.inputState.steering = -1;

            } else if (steerRight && !steerLeft) {

                this.inputState.steering = 1;

            } else {

                this.inputState.steering = 0;

            }

        }

        this.inputState.handbrake =
            handbrake;

    }

    getState() {
        return this.inputState;
    }

    destroy() {
        this.keyboard.destroy();
    }
}