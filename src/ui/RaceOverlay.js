import GameState from "../core/GameState";

export default class RaceOverlay {
    constructor() {
        this.currentGesture = "NONE";

        this.createStyles();
        this.createInterface();
    }

    createStyles() {
        if (
            document.getElementById(
                "race-overlay-styles"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id = "race-overlay-styles";

        style.textContent = `
            #race-overlay {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 1000;
                font-family: Arial, sans-serif;
                color: white;
            }

            #race-message-panel {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                min-width: 340px;
                padding: 28px 34px;
                border-radius: 18px;
                text-align: center;
                background: rgba(5, 10, 20, 0.78);
                border: 1px solid rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
            }

            #race-title {
                margin: 0 0 12px;
                font-size: 32px;
            }

            #race-main-message {
                margin: 10px 0;
                font-size: 24px;
                font-weight: bold;
            }

            #race-sub-message {
                margin: 8px 0 0;
                font-size: 16px;
                color: rgba(255, 255, 255, 0.8);
                line-height: 1.5;
            }

            #countdown-text {
                display: none;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 120px;
                font-weight: bold;
                text-shadow:
                    0 0 20px rgba(255, 255, 255, 0.8);
            }

            #race-hud {
                display: none;
                position: absolute;
                top: 20px;
                left: 20px;
                min-width: 230px;
                padding: 16px 18px;
                border-radius: 14px;
                background: rgba(5, 10, 20, 0.72);
                border: 1px solid rgba(255, 255, 255, 0.18);
                backdrop-filter: blur(8px);
            }

            .race-hud-row {
                display: flex;
                justify-content: space-between;
                gap: 28px;
                margin: 7px 0;
                font-size: 16px;
            }

            .race-hud-label {
                color: rgba(255, 255, 255, 0.7);
            }

            .race-hud-value {
                font-weight: bold;
            }

            #gesture-panel {
                position: absolute;
                top: 20px;
                right: 20px;
                min-width: 180px;
                padding: 14px 18px;
                border-radius: 14px;
                text-align: center;
                background: rgba(5, 10, 20, 0.72);
                border: 1px solid rgba(255, 255, 255, 0.18);
                backdrop-filter: blur(8px);
            }

            #gesture-value {
                margin-top: 7px;
                font-size: 21px;
                font-weight: bold;
            }

            #race-results {
                margin-top: 18px;
                text-align: left;
            }

            .result-row {
                display: flex;
                justify-content: space-between;
                gap: 30px;
                margin: 9px 0;
            }

            .hidden {
                display: none !important;
            }
        `;

        document.head.appendChild(style);
    }

    createInterface() {
        this.root =
            document.createElement("div");

        this.root.id = "race-overlay";

        this.root.innerHTML = `
            <section id="race-message-panel">
                <h1 id="race-title">
                    Virtual Steering Wheel Racer
                </h1>

                <div id="race-main-message">
                    Show Thumbs Up
                </div>

                <div id="race-sub-message">
                    👍 Start Race<br>
                    ✋ Pause Race<br>
                    👎 Finish Race
                </div>

                <div
                    id="race-results"
                    class="hidden"
                >
                    <div class="result-row">
                        <span>Race Time</span>
                        <strong id="result-time">
                            00:00.00
                        </strong>
                    </div>

                    <div class="result-row">
                        <span>Distance</span>
                        <strong id="result-distance">
                            0 m
                        </strong>
                    </div>

                    <div class="result-row">
                        <span>Average Speed</span>
                        <strong id="result-average-speed">
                            0 km/h
                        </strong>
                    </div>
                </div>
            </section>

            <div id="countdown-text">
                3
            </div>

            <section id="race-hud">
                <div class="race-hud-row">
                    <span class="race-hud-label">
                        Speed
                    </span>

                    <span
                        id="hud-speed"
                        class="race-hud-value"
                    >
                        0 km/h
                    </span>
                </div>

                <div class="race-hud-row">
                    <span class="race-hud-label">
                        Time
                    </span>

                    <span
                        id="hud-time"
                        class="race-hud-value"
                    >
                        00:00.00
                    </span>
                </div>

                <div class="race-hud-row">
                    <span class="race-hud-label">
                        Distance
                    </span>

                    <span
                        id="hud-distance"
                        class="race-hud-value"
                    >
                        0 m
                    </span>
                </div>

                <div class="race-hud-row">
                    <span class="race-hud-label">
                        State
                    </span>

                    <span
                        id="hud-state"
                        class="race-hud-value"
                    >
                        WAITING
                    </span>
                </div>
            </section>

            <section id="gesture-panel">
                <div>Detected Gesture</div>

                <div id="gesture-value">
                    NONE
                </div>
            </section>
        `;

        document.body.appendChild(this.root);

        this.messagePanel =
            this.root.querySelector(
                "#race-message-panel"
            );

        this.title =
            this.root.querySelector(
                "#race-title"
            );

        this.mainMessage =
            this.root.querySelector(
                "#race-main-message"
            );

        this.subMessage =
            this.root.querySelector(
                "#race-sub-message"
            );

        this.results =
            this.root.querySelector(
                "#race-results"
            );

        this.countdownText =
            this.root.querySelector(
                "#countdown-text"
            );

        this.hud =
            this.root.querySelector(
                "#race-hud"
            );

        this.hudSpeed =
            this.root.querySelector(
                "#hud-speed"
            );

        this.hudTime =
            this.root.querySelector(
                "#hud-time"
            );

        this.hudDistance =
            this.root.querySelector(
                "#hud-distance"
            );

        this.hudState =
            this.root.querySelector(
                "#hud-state"
            );

        this.gestureValue =
            this.root.querySelector(
                "#gesture-value"
            );

        this.resultTime =
            this.root.querySelector(
                "#result-time"
            );

        this.resultDistance =
            this.root.querySelector(
                "#result-distance"
            );

        this.resultAverageSpeed =
            this.root.querySelector(
                "#result-average-speed"
            );
    }

    update(
        raceManager,
        vehicleState,
        gesture
    ) {
        const state =
            raceManager.getState();

        this.setGesture(gesture);

        this.hudState.textContent = state;

        this.hudSpeed.textContent =
            `${Math.round(
                Math.abs(vehicleState.speed) *
                    3.6
            )} km/h`;

        this.hudTime.textContent =
            raceManager.getFormattedTime();

        this.hudDistance.textContent =
            this.formatDistance(
                raceManager.getRaceDistance()
            );

        switch (state) {
            case GameState.WAITING:
                this.showWaiting();
                break;

            case GameState.COUNTDOWN:
                this.showCountdown(
                    raceManager.getCountdownText()
                );
                break;

            case GameState.PLAYING:
                this.showPlaying();
                break;

            case GameState.PAUSED:
                this.showPaused();
                break;

            case GameState.FINISHED:
                this.showFinished(
                    raceManager
                );
                break;

            default:
                break;
        }
    }

    showWaiting() {
        this.messagePanel.classList.remove(
            "hidden"
        );

        this.countdownText.style.display =
            "none";

        this.hud.style.display = "none";

        this.results.classList.add("hidden");

        this.title.textContent =
            "Virtual Steering Wheel Racer";

        this.mainMessage.textContent =
            "👍 Show Thumbs Up to Start";

        this.subMessage.innerHTML = `
            👍 Start Race<br>
            ✋ Pause Race<br>
            👎 Finish Race
        `;
    }

    showCountdown(value) {
        this.messagePanel.classList.add(
            "hidden"
        );

        this.hud.style.display = "none";

        this.countdownText.style.display =
            "block";

        this.countdownText.textContent =
            value;
    }

    showPlaying() {
        this.messagePanel.classList.add(
            "hidden"
        );

        this.countdownText.style.display =
            "none";

        this.hud.style.display = "block";
    }

    showPaused() {
        this.messagePanel.classList.remove(
            "hidden"
        );

        this.countdownText.style.display =
            "none";

        this.hud.style.display = "block";

        this.results.classList.add("hidden");

        this.title.textContent =
            "Race Paused";

        this.mainMessage.textContent =
            "👍 Show Thumbs Up to Resume";

        this.subMessage.textContent =
            "Show thumbs down to finish the race.";
    }

    showFinished(raceManager) {
        this.messagePanel.classList.remove(
            "hidden"
        );

        this.countdownText.style.display =
            "none";

        this.hud.style.display = "none";

        this.results.classList.remove(
            "hidden"
        );

        this.title.textContent =
            "Race Finished";

        this.mainMessage.textContent =
            "👍 Show Thumbs Up to Race Again";

        this.subMessage.textContent =
            "Final race statistics";

        this.resultTime.textContent =
            raceManager.getFormattedTime();

        this.resultDistance.textContent =
            this.formatDistance(
                raceManager.getRaceDistance()
            );

        this.resultAverageSpeed.textContent =
            `${raceManager
                .getAverageSpeedKmh()
                .toFixed(1)} km/h`;
    }

    setGesture(gesture) {
        this.currentGesture =
            gesture || "NONE";

        this.gestureValue.textContent =
            this.getGestureLabel(
                this.currentGesture
            );
    }

    getGestureLabel(gesture) {
        switch (gesture) {
            case "THUMBS_UP":
                return "👍 THUMBS UP";

            case "OPEN_PALM":
                return "✋ OPEN PALM";

            case "THUMBS_DOWN":
                return "👎 THUMBS DOWN";

            case "FIST":
                return "✊ FIST";

            default:
                return "NONE";
        }
    }

    formatDistance(distance) {
        if (distance >= 1000) {
            return `${(
                distance / 1000
            ).toFixed(2)} km`;
        }

        return `${Math.round(distance)} m`;
    }

    destroy() {
        if (this.root) {
            this.root.remove();
        }
    }
}