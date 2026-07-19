import Scene from "./Scene";
import Camera from "./Camera";
import Renderer from "./Renderer";
import Lights from "./Lights";
import GameLoop from "./GameLoop";

import World from "../world/World";

import InputManager from "../input/InputManager";
import VehicleState from "../vehicle/VehicleState";
import VehicleController from "../vehicle/VehicleController";

import Cockpit from "../cockpit/Cockpit";

import HandTracker from "../mediapipe/HandTracker";
import SteeringCalculator from "../mediapipe/SteeringCalculator";

const GAME_STATE = Object.freeze({
    WAITING: "WAITING",
    COUNTDOWN: "COUNTDOWN",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    FINISHED: "FINISHED"
});

export default class Game {

    constructor() {

        //---------------------------------
        // Main systems
        //---------------------------------

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.lights = null;

        this.world = null;

        this.inputManager = null;
        this.vehicleState = null;
        this.vehicleController = null;

        this.cockpit = null;

        this.handTracker = null;
        this.steeringCalculator = null;

        this.gameLoop = null;

        //---------------------------------
        // Game state
        //---------------------------------

        this.gameState = GAME_STATE.WAITING;

        this.countdownDuration = 3;
        this.countdownRemaining = 3;

        this.raceTime = 0;
        this.totalDistance = 0;

        this.startPosition = null;
        this.startHeading = 0;

        this.previousVehiclePosition = null;

        //---------------------------------
        // Gesture stability
        //---------------------------------

        this.currentGesture = "NONE";
        this.previousGesture = "NONE";

        this.gestureCandidate = "NONE";
        this.gestureCandidateFrames = 0;

        this.requiredGestureFrames = 8;

        this.lastGestureActionTime = 0;
        this.gestureCooldown = 1000;

        this.gestureScore = 0;

        //---------------------------------
        // FPS
        //---------------------------------

        this.fps = 0;
        this.frameCounter = 0;
        this.fpsElapsed = 0;

        //---------------------------------
        // UI
        //---------------------------------

        this.overlay = null;
        this.stateElement = null;
        this.messageElement = null;
        this.countdownElement = null;

        this.speedElement = null;
        this.timerElement = null;
        this.distanceElement = null;
        this.gestureElement = null;
        this.steeringElement = null;
        this.handsElement = null;
        this.fpsElement = null;

        //---------------------------------
        // Start initialization
        //---------------------------------

        this.initialize().catch((error) => {

            console.error(
                "Game initialization failed:",
                error
            );

            this.showInitializationError(error);

        });

    }

    async initialize() {

        this.initializeCore();

        // Road must exist before vehicle spawn
        this.initializeWorld();

        // Vehicle uses road starting position
        this.initializeVehicle();

        this.initializeEvents();

        this.initializeOverlay();

        this.steeringCalculator =
            new SteeringCalculator();

        await this.initializeHandTracking();

        this.setGameState(
            GAME_STATE.WAITING
        );

        this.initializeLoop();

    }

    initializeCore() {

        this.scene =
            new Scene();

        this.camera =
            new Camera();

        this.renderer =
            new Renderer();

        this.threeScene =
            this.scene.getScene();

        this.threeCamera =
            this.camera.getCamera();

        this.lights =
            new Lights(
                this.threeScene
            );

        this.threeScene.add(
            this.threeCamera
        );

        this.cockpit =
            new Cockpit(
                this.threeCamera
            );

    }

    initializeWorld() {

        this.world =
            new World(
                this.threeScene
            );

    }

    initializeVehicle() {

        this.inputManager =
            new InputManager();

        this.vehicleState =
            new VehicleState();

        //---------------------------------
        // Store race starting transform
        //---------------------------------

        const roadStartPosition =
            this.world.road.getStartPosition();

        const roadStartHeading =
            this.world.road.getStartHeading();

        this.startPosition =
            roadStartPosition.clone();

        this.startHeading =
            roadStartHeading;

        //---------------------------------
        // Spawn vehicle
        //---------------------------------

        this.vehicleState.position.copy(
            this.startPosition
        );

        this.vehicleState.heading =
            this.startHeading;

        this.previousVehiclePosition =
            this.vehicleState.position.clone();

        //---------------------------------
        // Vehicle controller
        //---------------------------------

        this.vehicleController =
            new VehicleController(
                this.vehicleState,
                this.inputManager
            );

    }

    initializeEvents() {

        this.handleResize =
            this.handleResize.bind(this);

        this.handleKeyDown =
            this.handleKeyDown.bind(this);

        this.handleBeforeUnload =
            this.handleBeforeUnload.bind(this);

        window.addEventListener(
            "resize",
            this.handleResize
        );

        window.addEventListener(
            "keydown",
            this.handleKeyDown
        );

        window.addEventListener(
            "beforeunload",
            this.handleBeforeUnload
        );

        this.handleResize();

    }

    async initializeHandTracking() {

        try {

            this.handTracker =
                new HandTracker();

            await this.handTracker.initialize();

            console.log(
                "Gesture recognition initialized"
            );

        } catch (error) {

            console.error(
                "Hand tracking initialization failed:",
                error
            );

            this.handTracker = null;

            if (this.gestureElement) {

                this.gestureElement.textContent =
                    "Camera unavailable";

            }

        }

    }

    initializeLoop() {

        this.gameLoop =
            new GameLoop(
                this.update.bind(this)
            );

        this.gameLoop.start();

    }

    update(deltaTime) {

        //---------------------------------
        // Prevent unstable large frame steps
        //---------------------------------

        const safeDeltaTime =
            Math.min(
                Math.max(deltaTime || 0, 0),
                0.1
            );

        //---------------------------------
        // MediaPipe and gestures
        //---------------------------------

        this.updateHandTracking();

        this.updateGestureActions();

        //---------------------------------
        // State-specific update
        //---------------------------------

        switch (this.gameState) {

            case GAME_STATE.WAITING:

                this.updateWaiting();

                break;

            case GAME_STATE.COUNTDOWN:

                this.updateCountdown(
                    safeDeltaTime
                );

                break;

            case GAME_STATE.PLAYING:

                this.updatePlaying(
                    safeDeltaTime
                );

                break;

            case GAME_STATE.PAUSED:

                this.updatePaused();

                break;

            case GAME_STATE.FINISHED:

                this.updateFinished();

                break;

            default:

                break;

        }

        //---------------------------------
        // Camera
        //---------------------------------

        this.camera.update(
            this.vehicleState
        );

        //---------------------------------
        // Cockpit
        //---------------------------------

        this.cockpit.update(
            safeDeltaTime,
            this.vehicleState
        );

        //---------------------------------
        // FPS and HUD
        //---------------------------------

        this.updateFPS(
            safeDeltaTime
        );

        this.updateHUD();

        //---------------------------------
        // Render
        //---------------------------------

        this.renderer.render(
            this.threeScene,
            this.threeCamera
        );

    }

    updateHandTracking() {

        if (
            !this.handTracker ||
            !this.steeringCalculator
        ) {

            this.inputManager.setAISteering(0);

            return;

        }

        this.handTracker.update();

        const results =
            this.handTracker.getResults();

        //---------------------------------
        // Steering
        //---------------------------------

        this.steeringCalculator.update(
            results
        );

        const steering =
            this.steeringCalculator.getSteering();

        this.inputManager.setAISteering(
            steering
        );

        //---------------------------------
        // Gesture
        //---------------------------------

        const detectedGesture =
            this.getDetectedGesture();

        this.gestureScore =
            this.getDetectedGestureScore();

        this.updateStableGesture(
            detectedGesture
        );

    }

    getDetectedGesture() {

        if (
            !this.handTracker ||
            typeof this.handTracker.getGestureName !==
            "function"
        ) {

            return "NONE";

        }

        const gesture =
            this.handTracker.getGestureName();

        return this.normalizeGesture(
            gesture
        );

    }

    getDetectedGestureScore() {

        if (
            !this.handTracker ||
            typeof this.handTracker.getGestureScore !==
            "function"
        ) {

            return 0;

        }

        return (
            this.handTracker.getGestureScore() || 0
        );

    }

    normalizeGesture(gesture) {

        if (!gesture) {

            return "NONE";

        }

        const normalized =
            String(gesture)
                .trim()
                .toUpperCase()
                .replaceAll(" ", "_")
                .replaceAll("-", "_");

        const gestureMap = {

            THUMB_UP: "THUMBS_UP",
            THUMBS_UP: "THUMBS_UP",

            THUMB_DOWN: "THUMBS_DOWN",
            THUMBS_DOWN: "THUMBS_DOWN",

            OPEN_PALM: "OPEN_PALM",
            OPEN_HAND: "OPEN_PALM",

            CLOSED_FIST: "FIST",
            FIST: "FIST",

            VICTORY: "VICTORY",

            NONE: "NONE"

        };

        return (
            gestureMap[normalized] ||
            normalized
        );

    }

    updateStableGesture(detectedGesture) {

        if (
            detectedGesture ===
            this.gestureCandidate
        ) {

            this.gestureCandidateFrames++;

        } else {

            this.gestureCandidate =
                detectedGesture;

            this.gestureCandidateFrames = 1;

        }

        if (
            this.gestureCandidateFrames >=
            this.requiredGestureFrames
        ) {

            this.currentGesture =
                this.gestureCandidate;

        }

    }

    updateGestureActions() {

        if (
            this.currentGesture ===
            this.previousGesture
        ) {

            // Fist should continue braking
            // while the gesture remains active.
            if (
                this.currentGesture === "FIST" &&
                this.gameState === GAME_STATE.PLAYING
            ) {

                this.applyEmergencyBrake();

            }

            return;

        }

        const now =
            performance.now();

        const cooldownCompleted =
            now - this.lastGestureActionTime >=
            this.gestureCooldown;

        if (!cooldownCompleted) {

            this.previousGesture =
                this.currentGesture;

            return;

        }

        switch (this.currentGesture) {

            case "THUMBS_UP":

                this.handleThumbsUp();

                break;

            case "OPEN_PALM":

                this.handleOpenPalm();

                break;

            case "THUMBS_DOWN":

                this.handleThumbsDown();

                break;

            case "FIST":

                this.handleFist();

                break;

            default:

                break;

        }

        this.previousGesture =
            this.currentGesture;

    }

    handleThumbsUp() {

        if (
            this.gameState ===
            GAME_STATE.WAITING
        ) {

            this.startCountdown();

            return;

        }

        if (
            this.gameState ===
            GAME_STATE.PAUSED
        ) {

            this.resumeRace();

            return;

        }

        if (
            this.gameState ===
            GAME_STATE.FINISHED
        ) {

            this.restartRace();

        }

    }

    handleOpenPalm() {

        if (
            this.gameState ===
            GAME_STATE.PLAYING
        ) {

            this.pauseRace();

        }

    }

    handleThumbsDown() {

        if (
            this.gameState ===
            GAME_STATE.PLAYING ||
            this.gameState ===
            GAME_STATE.PAUSED
        ) {

            this.finishRace();

        }

    }

    handleFist() {

        if (
            this.gameState ===
            GAME_STATE.PLAYING
        ) {

            this.applyEmergencyBrake();

        }

    }

    updateWaiting() {

    this.vehicleController.setAutoThrottle(false);

    this.stopVehicle();

    this.world.update(
        0,
        this.vehicleState
    );

}

    updateCountdown(deltaTime) {

        this.stopVehicle();

        this.countdownRemaining -=
            deltaTime;

        const countdownNumber =
            Math.ceil(
                this.countdownRemaining
            );

        if (
            this.countdownElement
        ) {

            this.countdownElement.textContent =
                countdownNumber > 0
                    ? String(countdownNumber)
                    : "GO!";

        }

        this.world.update(
            0,
            this.vehicleState
        );

        if (
            this.countdownRemaining <= -0.6
        ) {

            this.beginRace();

        }

    }

    updatePlaying(deltaTime) {

        //---------------------------------
        // Race timer
        //---------------------------------

        this.raceTime +=
            deltaTime;

        //---------------------------------
        // Physics
        //---------------------------------

        this.vehicleController.update(
            deltaTime
        );

        //---------------------------------
        // Distance
        //---------------------------------

        this.updateDistance();

        //---------------------------------
        // World
        //---------------------------------

        this.world.update(
            deltaTime,
            this.vehicleState
        );

    }

    updatePaused() {

        this.world.update(
            0,
            this.vehicleState
        );

    }

    updateFinished() {

        this.stopVehicle();

        this.world.update(
            0,
            this.vehicleState
        );

    }

    updateDistance() {

        if (
            !this.previousVehiclePosition ||
            !this.vehicleState?.position
        ) {

            return;

        }

        const frameDistance =
            this.vehicleState.position.distanceTo(
                this.previousVehiclePosition
            );

        // Ignore abnormal teleport distances.
        if (
            Number.isFinite(frameDistance) &&
            frameDistance < 20
        ) {

            this.totalDistance +=
                frameDistance;

        }

        this.previousVehiclePosition.copy(
            this.vehicleState.position
        );

    }

    startCountdown() {

        this.resetRaceData();

        this.countdownRemaining =
            this.countdownDuration;

        this.lastGestureActionTime =
            performance.now();

        this.setGameState(
            GAME_STATE.COUNTDOWN
        );

    }

    beginRace() {

    this.vehicleController.setAutoThrottle(true);

    this.lastGestureActionTime =
        performance.now();

    this.setGameState(
        GAME_STATE.PLAYING
    );

}

    pauseRace() {

    this.vehicleController.setAutoThrottle(false);

    this.lastGestureActionTime =
        performance.now();

    this.setGameState(
        GAME_STATE.PAUSED
    );

}

    resumeRace() {

    this.vehicleController.setAutoThrottle(true);

    this.previousVehiclePosition.copy(
        this.vehicleState.position
    );

    this.lastGestureActionTime =
        performance.now();

    this.setGameState(
        GAME_STATE.PLAYING
    );

}

    finishRace() {

    this.vehicleController.setAutoThrottle(false);

    this.stopVehicle();

    this.lastGestureActionTime =
        performance.now();

    this.setGameState(
        GAME_STATE.FINISHED
    );

}

    restartRace() {

    this.vehicleController.setAutoThrottle(false);

    this.resetVehicle();

    this.resetRaceData();

    this.startCountdown();

}

    resetRaceData() {

        this.raceTime = 0;
        this.totalDistance = 0;

        this.resetVehicle();

        this.previousVehiclePosition.copy(
            this.vehicleState.position
        );

    }

    resetVehicle() {

        if (
            this.startPosition &&
            this.vehicleState?.position
        ) {

            this.vehicleState.position.copy(
                this.startPosition
            );

        }

        this.vehicleState.heading =
            this.startHeading;

        //---------------------------------
        // Reset common speed properties
        //---------------------------------

        if (
            typeof this.vehicleState.speed ===
            "number"
        ) {

            this.vehicleState.speed = 0;

        }

        if (
            typeof this.vehicleState.velocity ===
            "number"
        ) {

            this.vehicleState.velocity = 0;

        } else if (
            this.vehicleState.velocity &&
            typeof this.vehicleState.velocity.set ===
            "function"
        ) {

            this.vehicleState.velocity.set(
                0,
                0,
                0
            );

        }

        if (
            typeof this.vehicleState.steeringAngle ===
            "number"
        ) {

            this.vehicleState.steeringAngle = 0;

        }

        if (
            typeof this.vehicleState.steering ===
            "number"
        ) {

            this.vehicleState.steering = 0;

        }

        this.inputManager.setAISteering(0);

    }

    stopVehicle() {

        if (!this.vehicleState) {

            return;

        }

        if (
            typeof this.vehicleState.speed ===
            "number"
        ) {

            this.vehicleState.speed = 0;

        }

        if (
            typeof this.vehicleState.velocity ===
            "number"
        ) {

            this.vehicleState.velocity = 0;

        } else if (
            this.vehicleState.velocity &&
            typeof this.vehicleState.velocity.set ===
            "function"
        ) {

            this.vehicleState.velocity.set(
                0,
                0,
                0
            );

        }

    }

    applyEmergencyBrake() {

        if (!this.vehicleState) {

            return;

        }

        if (
            typeof this.vehicleState.speed ===
            "number"
        ) {

            this.vehicleState.speed *= 0.72;

            if (
                Math.abs(
                    this.vehicleState.speed
                ) < 0.05
            ) {

                this.vehicleState.speed = 0;

            }

        }

        if (
            typeof this.vehicleState.velocity ===
            "number"
        ) {

            this.vehicleState.velocity *=
                0.72;

        } else if (
            this.vehicleState.velocity &&
            typeof this.vehicleState.velocity.multiplyScalar ===
            "function"
        ) {

            this.vehicleState.velocity.multiplyScalar(
                0.72
            );

        }

    }

    setGameState(newState) {

        if (
            this.gameState === newState
        ) {

            return;

        }

        this.gameState =
            newState;

        if (
            this.stateElement
        ) {

            this.stateElement.textContent =
                newState;

        }

        this.updateStateMessage();

    }

    updateStateMessage() {

        if (
            !this.messageElement ||
            !this.countdownElement
        ) {

            return;

        }

        this.countdownElement.style.display =
            "none";

        switch (this.gameState) {

            case GAME_STATE.WAITING:

                this.messageElement.innerHTML = `
                    <strong>Ready to Drive?</strong>
                    <span>Show 👍 Thumbs Up to start</span>
                `;

                this.messageElement.style.display =
                    "flex";

                break;

            case GAME_STATE.COUNTDOWN:

                this.messageElement.style.display =
                    "none";

                this.countdownElement.style.display =
                    "flex";

                break;

            case GAME_STATE.PLAYING:

                this.messageElement.style.display =
                    "none";

                break;

            case GAME_STATE.PAUSED:

                this.messageElement.innerHTML = `
                    <strong>Race Paused</strong>
                    <span>Show 👍 Thumbs Up to resume</span>
                `;

                this.messageElement.style.display =
                    "flex";

                break;

            case GAME_STATE.FINISHED:

                this.messageElement.innerHTML = `
                    <strong>Race Finished</strong>
                    <span>
                        Time: ${this.formatTime(this.raceTime)}
                        &nbsp; | &nbsp;
                        Distance: ${this.totalDistance.toFixed(1)} m
                    </span>
                    <span>Show 👍 Thumbs Up to race again</span>
                `;

                this.messageElement.style.display =
                    "flex";

                break;

            default:

                break;

        }

    }

    initializeOverlay() {

        //---------------------------------
        // Remove an old overlay during HMR
        //---------------------------------

        const oldOverlay =
            document.getElementById(
                "race-game-overlay"
            );

        if (oldOverlay) {

            oldOverlay.remove();

        }

        //---------------------------------
        // Styles
        //---------------------------------

        const oldStyles =
            document.getElementById(
                "race-game-overlay-styles"
            );

        if (oldStyles) {

            oldStyles.remove();

        }

        const style =
            document.createElement("style");

        style.id =
            "race-game-overlay-styles";

        style.textContent = `
            #race-game-overlay {
                position: fixed;
                inset: 0;
                z-index: 1000;
                pointer-events: none;
                color: white;
                font-family:
                    Inter,
                    Arial,
                    sans-serif;
            }

            #race-game-overlay * {
                box-sizing: border-box;
            }

            .race-top-bar {
                position: absolute;
                top: 18px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 10px;
                align-items: center;
                padding: 10px 14px;
                border: 1px solid rgba(255,255,255,0.18);
                border-radius: 14px;
                background: rgba(10,14,22,0.68);
                backdrop-filter: blur(10px);
            }

            .race-state-label {
                font-size: 12px;
                letter-spacing: 1.5px;
                opacity: 0.65;
            }

            .race-state-value {
                font-size: 13px;
                font-weight: 700;
            }

            .race-hud {
                position: absolute;
                left: 20px;
                bottom: 20px;
                display: grid;
                grid-template-columns:
                    repeat(3, minmax(105px, 1fr));
                gap: 10px;
            }

            .race-hud-card {
                padding: 10px 13px;
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 12px;
                background: rgba(10,14,22,0.68);
                backdrop-filter: blur(10px);
            }

            .race-hud-label {
                display: block;
                margin-bottom: 4px;
                font-size: 10px;
                letter-spacing: 1.2px;
                text-transform: uppercase;
                opacity: 0.55;
            }

            .race-hud-value {
                font-size: 17px;
                font-weight: 700;
            }

            .race-gesture-panel {
                position: absolute;
                right: 20px;
                bottom: 20px;
                min-width: 190px;
                padding: 12px 14px;
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 12px;
                background: rgba(10,14,22,0.68);
                backdrop-filter: blur(10px);
            }

            .race-gesture-row {
                display: flex;
                justify-content: space-between;
                gap: 20px;
                margin: 5px 0;
                font-size: 13px;
            }

            .race-gesture-row span:first-child {
                opacity: 0.55;
            }

            .race-center-message {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                min-width: 330px;
                padding: 25px 30px;
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 20px;
                background: rgba(7,10,16,0.76);
                backdrop-filter: blur(16px);
                text-align: center;
            }

            .race-center-message strong {
                font-size: 30px;
            }

            .race-center-message span {
                font-size: 14px;
                opacity: 0.75;
            }

            .race-countdown {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: none;
                align-items: center;
                justify-content: center;
                width: 180px;
                height: 180px;
                border: 3px solid rgba(255,255,255,0.7);
                border-radius: 50%;
                background: rgba(7,10,16,0.55);
                backdrop-filter: blur(10px);
                font-size: 72px;
                font-weight: 800;
            }

            .race-controls {
                position: absolute;
                top: 20px;
                right: 20px;
                padding: 9px 12px;
                border-radius: 10px;
                background: rgba(10,14,22,0.55);
                font-size: 11px;
                opacity: 0.72;
            }

            @media (max-width: 700px) {
                .race-hud {
                    grid-template-columns:
                        repeat(2, minmax(90px, 1fr));
                }

                .race-gesture-panel {
                    display: none;
                }

                .race-controls {
                    display: none;
                }

                .race-center-message {
                    min-width: 280px;
                }
            }
        `;

        document.head.appendChild(
            style
        );

        //---------------------------------
        // HTML
        //---------------------------------

        this.overlay =
            document.createElement("div");

        this.overlay.id =
            "race-game-overlay";

        this.overlay.innerHTML = `
            <div class="race-top-bar">
                <span class="race-state-label">
                    RACE STATE
                </span>

                <span
                    id="race-state-value"
                    class="race-state-value"
                >
                    WAITING
                </span>
            </div>

            <div class="race-controls">
                👍 Start/Resume &nbsp;
                ✋ Pause &nbsp;
                👎 Finish &nbsp;
                ✊ Brake
            </div>

            <div
                id="race-center-message"
                class="race-center-message"
            ></div>

            <div
                id="race-countdown"
                class="race-countdown"
            >
                3
            </div>

            <div class="race-hud">
                <div class="race-hud-card">
                    <span class="race-hud-label">
                        Speed
                    </span>

                    <span
                        id="race-speed"
                        class="race-hud-value"
                    >
                        0 km/h
                    </span>
                </div>

                <div class="race-hud-card">
                    <span class="race-hud-label">
                        Time
                    </span>

                    <span
                        id="race-time"
                        class="race-hud-value"
                    >
                        00:00.000
                    </span>
                </div>

                <div class="race-hud-card">
                    <span class="race-hud-label">
                        Distance
                    </span>

                    <span
                        id="race-distance"
                        class="race-hud-value"
                    >
                        0.0 m
                    </span>
                </div>

                <div class="race-hud-card">
                    <span class="race-hud-label">
                        FPS
                    </span>

                    <span
                        id="race-fps"
                        class="race-hud-value"
                    >
                        0
                    </span>
                </div>
            </div>

            <div class="race-gesture-panel">
                <div class="race-gesture-row">
                    <span>Gesture</span>
                    <strong id="race-gesture">
                        NONE
                    </strong>
                </div>

                <div class="race-gesture-row">
                    <span>Hands</span>
                    <strong id="race-hands">
                        0
                    </strong>
                </div>

                <div class="race-gesture-row">
                    <span>Steering</span>
                    <strong id="race-steering">
                        0°
                    </strong>
                </div>
            </div>
        `;

        document.body.appendChild(
            this.overlay
        );

        //---------------------------------
        // Element references
        //---------------------------------

        this.stateElement =
            document.getElementById(
                "race-state-value"
            );

        this.messageElement =
            document.getElementById(
                "race-center-message"
            );

        this.countdownElement =
            document.getElementById(
                "race-countdown"
            );

        this.speedElement =
            document.getElementById(
                "race-speed"
            );

        this.timerElement =
            document.getElementById(
                "race-time"
            );

        this.distanceElement =
            document.getElementById(
                "race-distance"
            );

        this.gestureElement =
            document.getElementById(
                "race-gesture"
            );

        this.steeringElement =
            document.getElementById(
                "race-steering"
            );

        this.handsElement =
            document.getElementById(
                "race-hands"
            );

        this.fpsElement =
            document.getElementById(
                "race-fps"
            );

    }

    updateHUD() {

        if (!this.overlay) {

            return;

        }

        const speed =
            this.getVehicleSpeed();

        const speedKmh =
            Math.abs(speed) * 3.6;

        if (
            this.speedElement
        ) {

            this.speedElement.textContent =
                `${speedKmh.toFixed(0)} km/h`;

        }

        if (
            this.timerElement
        ) {

            this.timerElement.textContent =
                this.formatTime(
                    this.raceTime
                );

        }

        if (
            this.distanceElement
        ) {

            this.distanceElement.textContent =
                `${this.totalDistance.toFixed(1)} m`;

        }

        if (
            this.gestureElement
        ) {

            const scoreText =
                this.gestureScore > 0
                    ? ` ${Math.round(
                        this.gestureScore * 100
                    )}%`
                    : "";

            this.gestureElement.textContent =
                `${this.getGestureDisplayName(
                    this.currentGesture
                )}${scoreText}`;

        }

        if (
            this.steeringElement &&
            this.steeringCalculator
        ) {

            const steeringDegrees =
                this.steeringCalculator
                    .getSteeringDegrees();

            this.steeringElement.textContent =
                `${steeringDegrees.toFixed(1)}°`;

        }

        if (
            this.handsElement &&
            this.steeringCalculator
        ) {

            this.handsElement.textContent =
                String(
                    this.steeringCalculator
                        .getHandCount()
                );

        }

        if (
            this.fpsElement
        ) {

            this.fpsElement.textContent =
                String(
                    Math.round(this.fps)
                );

        }

    }

    getVehicleSpeed() {

        if (!this.vehicleState) {

            return 0;

        }

        if (
            typeof this.vehicleState.speed ===
            "number"
        ) {

            return this.vehicleState.speed;

        }

        if (
            typeof this.vehicleState.velocity ===
            "number"
        ) {

            return this.vehicleState.velocity;

        }

        if (
            this.vehicleState.velocity &&
            typeof this.vehicleState.velocity.length ===
            "function"
        ) {

            return (
                this.vehicleState.velocity.length()
            );

        }

        return 0;

    }

    getGestureDisplayName(gesture) {

        const names = {

            THUMBS_UP: "👍 THUMBS UP",
            THUMBS_DOWN: "👎 THUMBS DOWN",
            OPEN_PALM: "✋ OPEN PALM",
            FIST: "✊ FIST",
            VICTORY: "✌️ VICTORY",
            NONE: "NONE"

        };

        return (
            names[gesture] ||
            gesture
        );

    }

    updateFPS(deltaTime) {

        this.frameCounter++;
        this.fpsElapsed += deltaTime;

        if (
            this.fpsElapsed >= 0.5
        ) {

            this.fps =
                this.frameCounter /
                this.fpsElapsed;

            this.frameCounter = 0;
            this.fpsElapsed = 0;

        }

    }

    formatTime(timeInSeconds) {

        const safeTime =
            Math.max(
                timeInSeconds || 0,
                0
            );

        const minutes =
            Math.floor(
                safeTime / 60
            );

        const seconds =
            Math.floor(
                safeTime % 60
            );

        const milliseconds =
            Math.floor(
                (safeTime % 1) * 1000
            );

        return (
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}.` +
            `${String(milliseconds).padStart(3, "0")}`
        );

    }

    handleKeyDown(event) {

        // Keyboard controls are useful while testing
        // before gesture recognition is stable.

        switch (event.code) {

            case "Enter":

                this.handleThumbsUp();

                break;

            case "KeyP":
            case "Escape":

                if (
                    this.gameState ===
                    GAME_STATE.PLAYING
                ) {

                    this.pauseRace();

                } else if (
                    this.gameState ===
                    GAME_STATE.PAUSED
                ) {

                    this.resumeRace();

                }

                break;

            case "KeyF":

                this.finishRace();

                break;

            case "KeyR":

                this.restartRace();

                break;

            case "Space":

                if (
                    this.gameState ===
                    GAME_STATE.PLAYING
                ) {

                    this.applyEmergencyBrake();

                }

                break;

            default:

                break;

        }

    }

    handleResize() {

        const width =
            window.innerWidth;

        const height =
            window.innerHeight;

        this.camera.updateAspectRatio(
            width,
            height
        );

        this.renderer.resize(
            width,
            height
        );

    }

    showInitializationError(error) {

        const errorBox =
            document.createElement("div");

        errorBox.style.position =
            "fixed";

        errorBox.style.left =
            "50%";

        errorBox.style.top =
            "50%";

        errorBox.style.transform =
            "translate(-50%, -50%)";

        errorBox.style.zIndex =
            "10000";

        errorBox.style.padding =
            "22px";

        errorBox.style.borderRadius =
            "12px";

        errorBox.style.background =
            "rgba(20, 5, 5, 0.94)";

        errorBox.style.color =
            "white";

        errorBox.style.fontFamily =
            "Arial, sans-serif";

        errorBox.innerHTML = `
            <strong>
                Game initialization failed
            </strong>

            <div style="margin-top: 8px; opacity: 0.8;">
                ${error?.message || error}
            </div>
        `;

        document.body.appendChild(
            errorBox
        );

    }

    handleBeforeUnload() {

        this.destroy();

    }

    destroy() {

        window.removeEventListener(
            "resize",
            this.handleResize
        );

        window.removeEventListener(
            "keydown",
            this.handleKeyDown
        );

        window.removeEventListener(
            "beforeunload",
            this.handleBeforeUnload
        );

        if (
            this.gameLoop &&
            typeof this.gameLoop.stop ===
            "function"
        ) {

            this.gameLoop.stop();

        }

        if (
            this.handTracker &&
            typeof this.handTracker.destroy ===
            "function"
        ) {

            this.handTracker.destroy();

        }

        if (
            this.inputManager &&
            typeof this.inputManager.destroy ===
            "function"
        ) {

            this.inputManager.destroy();

        }

        if (this.overlay) {

            this.overlay.remove();

        }

        const overlayStyles =
            document.getElementById(
                "race-game-overlay-styles"
            );

        if (overlayStyles) {

            overlayStyles.remove();

        }

    }

}