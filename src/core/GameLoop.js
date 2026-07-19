export default class GameLoop {
    constructor(update) {
        this.update = update;

        this.isRunning = false;

        this.lastTime = 0;

        this.animate = this.animate.bind(this);
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;

        requestAnimationFrame(this.animate);
    }

    stop() {
        this.isRunning = false;
    }

    animate(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;

        this.lastTime = currentTime;

        this.update(deltaTime);

        requestAnimationFrame(this.animate);
    }
}