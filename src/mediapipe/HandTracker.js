import {
    FilesetResolver,
    GestureRecognizer,
} from "@mediapipe/tasks-vision";

export default class HandTracker {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.container = null;

        this.gestureRecognizer = null;
        this.results = null;

        this.running = false;
        this.lastVideoTime = -1;

        this.previewWidth = 320;
        this.previewHeight = 240;

        this.minimumGestureScore = 0.65;

        this.connections = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],

            [0, 5],
            [5, 6],
            [6, 7],
            [7, 8],

            [5, 9],
            [9, 10],
            [10, 11],
            [11, 12],

            [9, 13],
            [13, 14],
            [14, 15],
            [15, 16],

            [13, 17],
            [17, 18],
            [18, 19],
            [19, 20],

            [0, 17],
        ];
    }

    async initialize() {
        try {
            this.createPreview();

            await this.openCamera();
            await this.loadModel();

            this.running = true;

            console.log(
                "MediaPipe gesture recognition initialized"
            );
        } catch (error) {
            console.error(
                "Failed to initialize hand tracking:",
                error
            );

            this.drawStatus(
                "Camera or model failed"
            );

            throw error;
        }
    }

    createPreview() {
        this.container =
            document.createElement("div");

        this.container.id =
            "hand-tracker-preview";

        Object.assign(
            this.container.style,
            {
                position: "fixed",
                top: "15px",
                right: "15px",
                width: `${this.previewWidth}px`,
                height: `${this.previewHeight}px`,
                border: "2px solid cyan",
                borderRadius: "10px",
                overflow: "hidden",
                zIndex: "999",
                background: "#111111",
            }
        );

        this.video =
            document.createElement("video");

        this.video.autoplay = true;
        this.video.playsInline = true;
        this.video.muted = true;

        Object.assign(
            this.video.style,
            {
                position: "absolute",
                inset: "0",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
            }
        );

        this.canvas =
            document.createElement("canvas");

        this.canvas.width =
            this.previewWidth;

        this.canvas.height =
            this.previewHeight;

        Object.assign(
            this.canvas.style,
            {
                position: "absolute",
                inset: "0",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                transform: "scaleX(-1)",
            }
        );

        this.ctx =
            this.canvas.getContext("2d");

        this.container.appendChild(
            this.video
        );

        this.container.appendChild(
            this.canvas
        );

        document.body.appendChild(
            this.container
        );
    }

    async openCamera() {
        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {
            throw new Error(
                "Webcam access is not supported in this browser."
            );
        }

        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    width: {
                        ideal: 640,
                    },
                    height: {
                        ideal: 480,
                    },
                    facingMode: "user",
                },
                audio: false,
            });

        this.video.srcObject = stream;

        await this.video.play();
    }

    async loadModel() {
        const vision =
            await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

        this.gestureRecognizer =
            await GestureRecognizer.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath:
                            "/models/gesture_recognizer.task",
                        delegate: "GPU",
                    },

                    runningMode: "VIDEO",

                    numHands: 2,

                    minHandDetectionConfidence:
                        0.6,

                    minHandPresenceConfidence:
                        0.6,

                    minTrackingConfidence:
                        0.6,

                    cannedGesturesClassifierOptions: {
                        scoreThreshold:
                            this.minimumGestureScore,
                    },
                }
            );
    }

    update() {
        if (
            !this.running ||
            !this.gestureRecognizer ||
            !this.video ||
            this.video.readyState < 2
        ) {
            return;
        }

        if (
            this.video.currentTime ===
            this.lastVideoTime
        ) {
            return;
        }

        this.lastVideoTime =
            this.video.currentTime;

        try {
            this.results =
                this.gestureRecognizer
                    .recognizeForVideo(
                        this.video,
                        performance.now()
                    );

            this.drawResults();
        } catch (error) {
            console.error(
                "Gesture recognition failed:",
                error
            );
        }
    }

    drawResults() {
        if (!this.ctx || !this.canvas) {
            return;
        }

        this.ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        const hands =
            this.results?.landmarks ?? [];

        if (hands.length === 0) {
            this.drawStatus(
                "Show your hands"
            );

            return;
        }

        for (
            let index = 0;
            index < hands.length;
            index++
        ) {
            const landmarks =
                hands[index];

            this.drawConnections(
                landmarks
            );

            this.drawLandmarks(
                landmarks
            );

            this.drawHandLabel(
                landmarks,
                index
            );

            this.drawGestureLabel(
                landmarks,
                index
            );
        }

        if (hands.length === 2) {
            this.drawSteeringLine(
                hands
            );
        }

        const detectedGesture =
            this.getGesture();

        if (
            detectedGesture !== "NONE"
        ) {
            this.drawStatus(
                this.getGestureDisplayName(
                    detectedGesture
                )
            );
        } else {
            this.drawStatus(
                `${hands.length} hand${
                    hands.length > 1
                        ? "s"
                        : ""
                } detected`
            );
        }
    }

    drawConnections(landmarks) {
        this.ctx.strokeStyle =
            "#00ffff";

        this.ctx.lineWidth = 3;
        this.ctx.lineCap = "round";

        for (
            const [
                startIndex,
                endIndex,
            ] of this.connections
        ) {
            const start =
                landmarks[startIndex];

            const end =
                landmarks[endIndex];

            if (!start || !end) {
                continue;
            }

            this.ctx.beginPath();

            this.ctx.moveTo(
                start.x *
                    this.canvas.width,
                start.y *
                    this.canvas.height
            );

            this.ctx.lineTo(
                end.x *
                    this.canvas.width,
                end.y *
                    this.canvas.height
            );

            this.ctx.stroke();
        }
    }

    drawLandmarks(landmarks) {
        for (
            const landmark of landmarks
        ) {
            const x =
                landmark.x *
                this.canvas.width;

            const y =
                landmark.y *
                this.canvas.height;

            this.ctx.beginPath();

            this.ctx.arc(
                x,
                y,
                4,
                0,
                Math.PI * 2
            );

            this.ctx.fillStyle =
                "#00ff88";

            this.ctx.fill();

            this.ctx.strokeStyle =
                "#003322";

            this.ctx.lineWidth = 1.5;

            this.ctx.stroke();
        }
    }

    drawHandLabel(
        landmarks,
        handIndex
    ) {
        const wrist =
            landmarks[0];

        if (!wrist) {
            return;
        }

        const handedness =
            this.results
                ?.handedness?.[
                    handIndex
                ]?.[0];

        const label =
            handedness
                ?.categoryName ??
            "Hand";

        const x =
            wrist.x *
            this.canvas.width;

        const y =
            wrist.y *
            this.canvas.height;

        this.drawMirroredText(
            label,
            x,
            y - 14,
            {
                font:
                    "bold 14px Arial",
                color: "#ffffff",
            }
        );
    }

    drawGestureLabel(
        landmarks,
        handIndex
    ) {
        const gestureCategory =
            this.results
                ?.gestures?.[
                    handIndex
                ]?.[0];

        if (!gestureCategory) {
            return;
        }

        const rawGesture =
            gestureCategory.categoryName;

        if (
            !rawGesture ||
            rawGesture === "None"
        ) {
            return;
        }

        const score =
            gestureCategory.score ?? 0;

        if (
            score <
            this.minimumGestureScore
        ) {
            return;
        }

        const indexTip =
            landmarks[8];

        if (!indexTip) {
            return;
        }

        const x =
            indexTip.x *
            this.canvas.width;

        const y =
            indexTip.y *
            this.canvas.height;

        const normalizedGesture =
            this.normalizeGestureName(
                rawGesture
            );

        const label =
            `${this.getGestureDisplayName(
                normalizedGesture
            )} ${Math.round(
                score * 100
            )}%`;

        this.drawMirroredText(
            label,
            x,
            y - 18,
            {
                font:
                    "bold 13px Arial",
                color: "#ffff00",
            }
        );
    }

    drawSteeringLine(hands) {
        if (hands.length < 2) {
            return;
        }

        const firstPalm =
            this.getPalmCenter(
                hands[0]
            );

        const secondPalm =
            this.getPalmCenter(
                hands[1]
            );

        const firstX =
            firstPalm.x *
            this.canvas.width;

        const firstY =
            firstPalm.y *
            this.canvas.height;

        const secondX =
            secondPalm.x *
            this.canvas.width;

        const secondY =
            secondPalm.y *
            this.canvas.height;

        this.ctx.beginPath();

        this.ctx.moveTo(
            firstX,
            firstY
        );

        this.ctx.lineTo(
            secondX,
            secondY
        );

        this.ctx.strokeStyle =
            "#ffff00";

        this.ctx.lineWidth = 5;

        this.ctx.stroke();

        this.ctx.beginPath();

        this.ctx.arc(
            firstX,
            firstY,
            7,
            0,
            Math.PI * 2
        );

        this.ctx.arc(
            secondX,
            secondY,
            7,
            0,
            Math.PI * 2
        );

        this.ctx.fillStyle =
            "#ff6600";

        this.ctx.fill();
    }

    getPalmCenter(landmarks) {
        const palmIndexes = [
            0,
            5,
            9,
            13,
            17,
        ];

        let x = 0;
        let y = 0;
        let z = 0;

        for (
            const index of palmIndexes
        ) {
            const landmark =
                landmarks[index];

            x += landmark.x;
            y += landmark.y;
            z += landmark.z;
        }

        return {
            x:
                x /
                palmIndexes.length,
            y:
                y /
                palmIndexes.length,
            z:
                z /
                palmIndexes.length,
        };
    }

    drawMirroredText(
        text,
        x,
        y,
        options = {}
    ) {
        const {
            font =
                "bold 14px Arial",
            color = "#ffffff",
        } = options;

        this.ctx.save();

        this.ctx.translate(
            x,
            y
        );

        this.ctx.scale(
            -1,
            1
        );

        this.ctx.font = font;

        this.ctx.textAlign =
            "center";

        this.ctx.textBaseline =
            "middle";

        this.ctx.fillStyle =
            "rgba(0, 0, 0, 0.7)";

        const textWidth =
            this.ctx.measureText(
                text
            ).width;

        this.ctx.fillRect(
            -textWidth / 2 - 6,
            -11,
            textWidth + 12,
            22
        );

        this.ctx.fillStyle =
            color;

        this.ctx.fillText(
            text,
            0,
            0
        );

        this.ctx.restore();
    }

    drawStatus(message) {
        if (!this.ctx) {
            return;
        }

        this.ctx.save();

        this.ctx.translate(
            this.canvas.width,
            0
        );

        this.ctx.scale(
            -1,
            1
        );

        this.ctx.fillStyle =
            "rgba(0, 0, 0, 0.7)";

        this.ctx.fillRect(
            8,
            this.canvas.height -
                36,
            220,
            28
        );

        this.ctx.font =
            "bold 14px Arial";

        this.ctx.textAlign =
            "left";

        this.ctx.textBaseline =
            "middle";

        this.ctx.fillStyle =
            "#ffffff";

        this.ctx.fillText(
            message,
            16,
            this.canvas.height -
                22
        );

        this.ctx.restore();
    }

    getResults() {
        return this.results;
    }

    getHands() {
        return (
            this.results
                ?.landmarks ?? []
        );
    }

    getHandedness() {
        return (
            this.results
                ?.handedness ?? []
        );
    }

    getRawGesture(
        handIndex = 0
    ) {
        const category =
            this.results
                ?.gestures?.[
                    handIndex
                ]?.[0];

        if (!category) {
            return "None";
        }

        if (
            category.score <
            this.minimumGestureScore
        ) {
            return "None";
        }

        return (
            category.categoryName ??
            "None"
        );
    }

    getGesture(
        handIndex = 0
    ) {
        const rawGesture =
            this.getRawGesture(
                handIndex
            );

        return this.normalizeGestureName(
            rawGesture
        );
    }

    getGestureName(
        handIndex = 0
    ) {
        return this.getGesture(
            handIndex
        );
    }

    getGestureScore(
        handIndex = 0
    ) {
        const category =
            this.results
                ?.gestures?.[
                    handIndex
                ]?.[0];

        return (
            category?.score ?? 0
        );
    }

    getAllGestures() {
        const gestures =
            this.results
                ?.gestures ?? [];

        return gestures.map(
            (
                handGestures,
                handIndex
            ) => {
                const category =
                    handGestures?.[0];

                const rawGesture =
                    category
                        ?.categoryName ??
                    "None";

                const score =
                    category?.score ??
                    0;

                return {
                    handIndex,
                    gesture:
                        score >=
                        this
                            .minimumGestureScore
                            ? this.normalizeGestureName(
                                  rawGesture
                              )
                            : "NONE",
                    rawGesture,
                    score,
                    handedness:
                        this.results
                            ?.handedness?.[
                                handIndex
                            ]?.[0]
                            ?.categoryName ??
                        "Unknown",
                };
            }
        );
    }

    normalizeGestureName(
        gestureName
    ) {
        const gestureMap = {
            None: "NONE",
            Closed_Fist: "FIST",
            Open_Palm:
                "OPEN_PALM",
            Pointing_Up:
                "POINTING_UP",
            Thumb_Down:
                "THUMBS_DOWN",
            Thumb_Up:
                "THUMBS_UP",
            Victory: "VICTORY",
            ILoveYou:
                "I_LOVE_YOU",
        };

        return (
            gestureMap[
                gestureName
            ] ?? "NONE"
        );
    }

    getGestureDisplayName(
        gesture
    ) {
        const labels = {
            NONE: "No Gesture",
            FIST: "✊ Fist",
            OPEN_PALM:
                "✋ Open Palm",
            POINTING_UP:
                "☝️ Pointing Up",
            THUMBS_DOWN:
                "👎 Thumbs Down",
            THUMBS_UP:
                "👍 Thumbs Up",
            VICTORY:
                "✌️ Victory",
            I_LOVE_YOU:
                "🤟 I Love You",
        };

        return (
            labels[gesture] ??
            gesture
        );
    }

    hasTwoHands() {
        return (
            this.getHands().length ===
            2
        );
    }

    hasHands() {
        return (
            this.getHands().length >
            0
        );
    }

    setPreviewVisible(
        visible
    ) {
        if (!this.container) {
            return;
        }

        this.container.style.display =
            visible
                ? "block"
                : "none";
    }

    stopCamera() {
        const stream =
            this.video?.srcObject;

        if (!stream) {
            return;
        }

        for (
            const track of stream.getTracks()
        ) {
            track.stop();
        }

        this.video.srcObject =
            null;
    }

    destroy() {
        this.running = false;

        this.stopCamera();

        if (
            this.gestureRecognizer
        ) {
            this.gestureRecognizer.close();

            this.gestureRecognizer =
                null;
        }

        if (this.container) {
            this.container.remove();

            this.container = null;
        }

        this.results = null;
    }
}