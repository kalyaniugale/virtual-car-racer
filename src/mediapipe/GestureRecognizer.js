export default class GestureRecognizer {

    constructor() {

        this.currentGesture = "NONE";
        this.lastStableGesture = "NONE";

        this.framesRequired = 8;
        this.cooldownTime = 1500;

        this.frameCounter = 0;
        this.lastRawGesture = "NONE";

        this.lastTriggerTime = 0;
    }

    update(rawGesture) {

        rawGesture = rawGesture || "NONE";

        //----------------------------------------
        // Stability Check
        //----------------------------------------

        if (rawGesture === this.lastRawGesture) {

            this.frameCounter++;

        } else {

            this.lastRawGesture = rawGesture;
            this.frameCounter = 1;

        }

        //----------------------------------------
        // Wait until gesture is stable
        //----------------------------------------

        if (this.frameCounter < this.framesRequired) {

            return null;

        }

        //----------------------------------------
        // Already active gesture
        //----------------------------------------

        if (rawGesture === this.lastStableGesture) {

            return null;

        }

        //----------------------------------------
        // Cooldown
        //----------------------------------------

        const now = performance.now();

        if (now - this.lastTriggerTime < this.cooldownTime) {

            return null;

        }

        this.lastTriggerTime = now;

        this.lastStableGesture = rawGesture;

        this.currentGesture = rawGesture;

        return rawGesture;

    }

    getCurrentGesture() {

        return this.currentGesture;

    }

    clear() {

        this.currentGesture = "NONE";
        this.lastStableGesture = "NONE";
        this.lastRawGesture = "NONE";
        this.frameCounter = 0;

    }

}