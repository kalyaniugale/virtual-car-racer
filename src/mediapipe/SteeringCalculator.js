export default class SteeringCalculator {

    constructor() {

        this.currentSteering = 0;

        this.maxSteeringAngle = 35;

        this.smoothing = 0.15;

        this.leftPalm = null;
        this.rightPalm = null;

        this.angle = 0;

        this.handCount = 0;

        this.isTracking = false;

    }

    update(results) {

        this.handCount =
            results?.landmarks?.length ?? 0;

        this.isTracking =
            this.handCount >= 2;

        if (!this.isTracking) {

            this.currentSteering *= 0.9;

            this.leftPalm = null;
            this.rightPalm = null;

            this.angle = 0;

            return;

        }

        const palms =
            results.landmarks.map(hand =>
                this.getPalmCenter(hand)
            );

        // Left hand = leftmost palm
        palms.sort((a, b) => a.x - b.x);

        this.leftPalm = palms[0];
        this.rightPalm = palms[1];

        const dx =
            this.rightPalm.x -
            this.leftPalm.x;

        const dy =
            this.rightPalm.y -
            this.leftPalm.y;

        this.angle =
            Math.atan2(dy, dx) *
            180 /
            Math.PI;

        let steering =
            -(this.angle /
            this.maxSteeringAngle);

        steering =
            Math.max(
                -1,
                Math.min(1, steering)
            );

        this.currentSteering +=
            (steering -
                this.currentSteering) *
            this.smoothing;

    }

    getPalmCenter(hand) {

        const ids = [0, 5, 9, 13, 17];

        let x = 0;
        let y = 0;

        for (const id of ids) {

            x += hand[id].x;
            y += hand[id].y;

        }

        return {

            x: x / ids.length,
            y: y / ids.length

        };

    }

    getSteering() {

        return this.currentSteering;

    }

    getAngle() {

        return this.angle;

    }

    getLeftPalm() {

        return this.leftPalm;

    }

    getRightPalm() {

        return this.rightPalm;

    }

    getHandCount() {

        return this.handCount;

    }

    isHandsDetected() {

        return this.isTracking;

    }

    getSteeringDegrees() {

        return (
            this.currentSteering *
            this.maxSteeringAngle
        );

    }

    getData() {

        return {

            steering:
                this.currentSteering,

            steeringDegrees:
                this.getSteeringDegrees(),

            angle:
                this.angle,

            leftPalm:
                this.leftPalm,

            rightPalm:
                this.rightPalm,

            handCount:
                this.handCount,

            tracking:
                this.isTracking

        };

    }

}