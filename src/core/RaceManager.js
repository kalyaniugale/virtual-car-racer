import GameState from "./GameState";

export default class RaceManager {
    constructor(vehicleState) {
        this.vehicleState = vehicleState;

        this.state = GameState.WAITING;

        this.countdownDuration = 3;
        this.countdownRemaining =
            this.countdownDuration;

        this.raceTime = 0;
        this.startDistance = 0;
        this.raceDistance = 0;

        this.averageSpeed = 0;

        this.countdownFinished = false;
    }

    update(deltaTime) {
        switch (this.state) {
            case GameState.COUNTDOWN:
                this.updateCountdown(deltaTime);
                break;

            case GameState.PLAYING:
                this.updateRace(deltaTime);
                break;

            default:
                break;
        }
    }

    updateCountdown(deltaTime) {
        this.countdownRemaining -= deltaTime;

        if (this.countdownRemaining <= -0.8) {
            this.startPlaying();
        }
    }

    updateRace(deltaTime) {
        this.raceTime += deltaTime;

        this.raceDistance =
            this.vehicleState.distanceTravelled -
            this.startDistance;

        if (this.raceTime > 0) {
            this.averageSpeed =
                this.raceDistance /
                this.raceTime;
        }
    }

    startCountdown() {
        if (
            this.state !== GameState.WAITING &&
            this.state !== GameState.FINISHED
        ) {
            return;
        }

        this.resetRaceData();

        this.state = GameState.COUNTDOWN;
        this.countdownRemaining =
            this.countdownDuration;

        this.vehicleState.engineRunning = false;
        this.vehicleState.speed = 0;
    }

    startPlaying() {
        this.state = GameState.PLAYING;

        this.vehicleState.engineRunning = true;

        this.countdownFinished = true;
    }

    pause() {
        if (this.state !== GameState.PLAYING) {
            return;
        }

        this.state = GameState.PAUSED;

        this.vehicleState.engineRunning = false;
        this.vehicleState.speed = 0;
    }

    resume() {
        if (this.state !== GameState.PAUSED) {
            return;
        }

        this.state = GameState.PLAYING;

        this.vehicleState.engineRunning = true;
    }

    finish() {
        if (
            this.state !== GameState.PLAYING &&
            this.state !== GameState.PAUSED
        ) {
            return;
        }

        this.state = GameState.FINISHED;

        this.vehicleState.engineRunning = false;
        this.vehicleState.speed = 0;
        this.vehicleState.steeringAngle = 0;

        this.raceDistance =
            this.vehicleState.distanceTravelled -
            this.startDistance;

        if (this.raceTime > 0) {
            this.averageSpeed =
                this.raceDistance /
                this.raceTime;
        }
    }

    resetToWaiting() {
        this.state = GameState.WAITING;

        this.resetRaceData();

        this.vehicleState.engineRunning = false;
        this.vehicleState.speed = 0;
        this.vehicleState.steeringAngle = 0;
    }

    resetRaceData() {
        this.raceTime = 0;
        this.raceDistance = 0;
        this.averageSpeed = 0;

        this.startDistance =
            this.vehicleState.distanceTravelled;

        this.countdownRemaining =
            this.countdownDuration;

        this.countdownFinished = false;
    }

    getState() {
        return this.state;
    }

    isPlaying() {
        return this.state === GameState.PLAYING;
    }

    isPaused() {
        return this.state === GameState.PAUSED;
    }

    getCountdownText() {
        if (this.state !== GameState.COUNTDOWN) {
            return "";
        }

        if (this.countdownRemaining > 0) {
            return Math.ceil(
                this.countdownRemaining
            ).toString();
        }

        return "GO!";
    }

    getRaceTime() {
        return this.raceTime;
    }

    getFormattedTime() {
        const totalSeconds =
            Math.max(0, this.raceTime);

        const minutes = Math.floor(
            totalSeconds / 60
        );

        const seconds = Math.floor(
            totalSeconds % 60
        );

        const milliseconds = Math.floor(
            (totalSeconds % 1) * 100
        );

        return (
            `${minutes
                .toString()
                .padStart(2, "0")}:` +
            `${seconds
                .toString()
                .padStart(2, "0")}.` +
            `${milliseconds
                .toString()
                .padStart(2, "0")}`
        );
    }

    getRaceDistance() {
        return Math.max(
            0,
            this.raceDistance
        );
    }

    getAverageSpeed() {
        return this.averageSpeed;
    }

    getAverageSpeedKmh() {
        return this.averageSpeed * 3.6;
    }
}