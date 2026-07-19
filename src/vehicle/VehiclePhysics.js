import * as THREE from "three";

export default class VehiclePhysics {

    constructor(vehicleState) {

        this.state = vehicleState;

        // =====================================================
        // Driving mode
        // =====================================================

        this.autoThrottle = false;

        // True when the vehicle is outside the road.
        // World or Road logic can update this later.
        this.isOffRoad = false;

        // =====================================================
        // Speed configuration
        // =====================================================

        // Maximum speed ≈ 50 km/h
this.maxForwardSpeed = 14;

// Cruise speed ≈ 36 km/h
this.cruiseSpeed = 10;

// Reverse ≈ 14 km/h
this.maxReverseSpeed = 4;

// Engine
this.engineAcceleration = 4.2;
this.reverseAcceleration = 2.5;

// Brakes
this.brakeForce = 12;
this.handbrakeForce = 18;

// Drag
this.rollingResistance = 0.8;
this.offRoadResistance = 3.5;


        // =====================================================
        // Smooth throttle configuration
        // =====================================================

        this.currentThrottle = 0;

        this.targetThrottle = 0;

        this.throttleRiseSpeed = 3.5;
this.throttleFallSpeed = 5;

        // Prevent cruise control repeatedly switching
        // between full throttle and zero.
        this.cruiseSpeedTolerance = 0.35;

        // =====================================================
        // Steering configuration
        // =====================================================

        this.maxSteeringAngle =
            THREE.MathUtils.degToRad(35);

        this.steeringSpeed =
            THREE.MathUtils.degToRad(95);

        this.steeringReturnSpeed =
            THREE.MathUtils.degToRad(125);

        // Distance between front and rear wheels
        this.wheelBase = 2.7;

        // Steering is reduced as speed increases
        this.minimumHighSpeedSteering = 0.42;

        // =====================================================
        // General configuration
        // =====================================================

        this.stopThreshold = 0.05;

        this.maximumDeltaTime = 0.1;

    }

    // =========================================================
    // Public controls
    // =========================================================

    setAutoThrottle(enabled) {

        this.autoThrottle =
            Boolean(enabled);

        if (!this.autoThrottle) {

            this.targetThrottle = 0;

        }

    }

    isAutoThrottleEnabled() {

        return this.autoThrottle;

    }

    setOffRoad(value) {

        this.isOffRoad =
            Boolean(value);

    }

    getOffRoadStatus() {

        return this.isOffRoad;

    }

    setCruiseSpeed(speed) {

        const safeSpeed =
            Number.isFinite(speed)
                ? speed
                : this.cruiseSpeed;

        this.cruiseSpeed =
            THREE.MathUtils.clamp(
                safeSpeed,
                1,
                this.maxForwardSpeed
            );

    }

    getCruiseSpeed() {

        return this.cruiseSpeed;

    }

    getCurrentThrottle() {

        return this.currentThrottle;

    }

    // =========================================================
    // Main update
    // =========================================================

    update(deltaTime, inputState = {}) {

        if (!this.state.engineRunning) {

            this.currentThrottle = 0;
            this.targetThrottle = 0;

            return;

        }

        const safeDeltaTime =
            THREE.MathUtils.clamp(
                deltaTime || 0,
                0,
                this.maximumDeltaTime
            );

        this.updateLongitudinalMovement(
            safeDeltaTime,
            inputState
        );

        this.updateSteering(
            safeDeltaTime,
            inputState
        );

        this.updateHeading(
            safeDeltaTime
        );

        this.updatePosition(
            safeDeltaTime
        );

        this.updateGear();

    }

    // =========================================================
    // Acceleration, braking and resistance
    // =========================================================

    updateLongitudinalMovement(
        deltaTime,
        inputState
    ) {

        const brake =
            THREE.MathUtils.clamp(
                Number(inputState.brake) || 0,
                0,
                1
            );

        const manualThrottle =
            THREE.MathUtils.clamp(
                Number(inputState.throttle) || 0,
                0,
                1
            );

        const handbrake =
            Boolean(inputState.handbrake);

        this.targetThrottle =
            this.calculateTargetThrottle(
                manualThrottle,
                brake,
                handbrake
            );

        this.updateSmoothThrottle(
            deltaTime
        );

        this.state.accelerationValue = 0;

        // Handbrake receives highest priority
        if (handbrake) {

            this.applyHandbrake();

        }

        // Normal brake receives second priority
        else if (brake > 0) {

            this.applyBrake(
                brake
            );

        }

        // Acceleration
        else if (this.currentThrottle > 0) {

            this.applyThrottle(
                this.currentThrottle
            );

        }

        // No user input
        else {

            this.applyRollingResistance();

        }

        // Extra resistance outside the road
        if (this.isOffRoad) {

            this.applyOffRoadResistance();

        }

        this.state.speed +=
            this.state.accelerationValue *
            deltaTime;

        const maximumAllowedSpeed =
            this.isOffRoad
                ? this.offRoadMaxSpeed
                : this.maxForwardSpeed;

        this.state.speed =
            THREE.MathUtils.clamp(
                this.state.speed,
                -this.maxReverseSpeed,
                maximumAllowedSpeed
            );

        this.preventRollingResistanceOvershoot(
            deltaTime
        );

        if (
            this.currentThrottle <= 0.01 &&
            brake <= 0.01 &&
            !handbrake &&
            Math.abs(this.state.speed) <
                this.stopThreshold
        ) {

            this.state.speed = 0;

        }

    }

    calculateTargetThrottle(
        manualThrottle,
        brake,
        handbrake
    ) {

        if (
            brake > 0 ||
            handbrake
        ) {

            return 0;

        }

        // Manual throttle receives priority.
        if (manualThrottle > 0) {

            return manualThrottle;

        }

        if (!this.autoThrottle) {

            return 0;

        }

        const speed =
            Math.max(
                this.state.speed,
                0
            );

        const lowerCruiseLimit =
            this.cruiseSpeed -
            this.cruiseSpeedTolerance;

        const upperCruiseLimit =
            this.cruiseSpeed +
            this.cruiseSpeedTolerance;

        // Strong acceleration when far below cruise speed.
        if (
            speed <
            this.cruiseSpeed * 0.5
        ) {

            return 1.0;

        }

        // Gentle acceleration near cruise speed.
        if (
            speed <
            lowerCruiseLimit
        ) {

            return 0.65;

        }

        // Slight throttle keeps the car near cruise speed
        // without rapidly accelerating.
        if (
            speed <=
            upperCruiseLimit
        ) {

            return 0.35;

        }

        return 0;

    }

    updateSmoothThrottle(deltaTime) {

        const smoothingSpeed =
            this.targetThrottle >
            this.currentThrottle
                ? this.throttleRiseSpeed
                : this.throttleFallSpeed;

        this.currentThrottle =
            this.moveTowards(
                this.currentThrottle,
                this.targetThrottle,
                smoothingSpeed *
                    deltaTime
            );

        this.currentThrottle =
            THREE.MathUtils.clamp(
                this.currentThrottle,
                0,
                1
            );

    }

    applyThrottle(throttleAmount) {

        // When moving backwards, throttle first slows
        // the vehicle before moving it forward.
        if (this.state.speed < 0) {

            this.state.accelerationValue =
                this.brakeForce *
                throttleAmount;

            return;

        }

        const speedRatio =
            THREE.MathUtils.clamp(
                this.state.speed /
                    this.maxForwardSpeed,
                0,
                1
            );

        // Engine becomes less powerful near maximum speed.
        const enginePowerReduction =
            THREE.MathUtils.lerp(
                1,
                0.25,
                speedRatio
            );

        this.state.accelerationValue =
            this.engineAcceleration *
            throttleAmount *
            enginePowerReduction;

    }

    applyBrake(brakeAmount) {

        if (
            this.state.speed >
            this.stopThreshold
        ) {

            this.state.accelerationValue =
                -this.brakeForce *
                brakeAmount;

            return;

        }

        // When almost stopped, brake input starts reverse.
        if (
            this.state.speed <=
            this.stopThreshold
        ) {

            this.state.accelerationValue =
                -this.reverseAcceleration *
                brakeAmount;

        }

    }

    applyRollingResistance() {

        if (
            this.state.speed >
            this.stopThreshold
        ) {

            this.state.accelerationValue =
                -this.rollingResistance;

        }

        else if (
            this.state.speed <
            -this.stopThreshold
        ) {

            this.state.accelerationValue =
                this.rollingResistance;

        }

    }

    applyOffRoadResistance() {

        if (
            this.state.speed >
            this.stopThreshold
        ) {

            this.state.accelerationValue -=
                this.offRoadResistance;

        }

        else if (
            this.state.speed <
            -this.stopThreshold
        ) {

            this.state.accelerationValue +=
                this.offRoadResistance;

        }

    }

    applyHandbrake() {

        this.currentThrottle = 0;
        this.targetThrottle = 0;

        if (
            this.state.speed >
            this.stopThreshold
        ) {

            this.state.accelerationValue =
                -this.handbrakeForce;

        }

        else if (
            this.state.speed <
            -this.stopThreshold
        ) {

            this.state.accelerationValue =
                this.handbrakeForce;

        }

        else {

            this.state.speed = 0;
            this.state.accelerationValue = 0;

        }

    }

    preventRollingResistanceOvershoot(
        deltaTime
    ) {

        if (
            this.state.speed > 0 &&
            this.state.accelerationValue < 0
        ) {

            const nextSpeed =
                this.state.speed +
                this.state.accelerationValue *
                deltaTime;

            if (nextSpeed < 0) {

                this.state.speed = 0;

            }

        }

        else if (
            this.state.speed < 0 &&
            this.state.accelerationValue > 0
        ) {

            const nextSpeed =
                this.state.speed +
                this.state.accelerationValue *
                deltaTime;

            if (nextSpeed > 0) {

                this.state.speed = 0;

            }

        }

    }

    // =========================================================
    // Steering
    // =========================================================

    updateSteering(
        deltaTime,
        inputState
    ) {

        const steeringInput =
            THREE.MathUtils.clamp(
                Number(inputState.steering) || 0,
                -1,
                1
            );

        const speedRatio =
            THREE.MathUtils.clamp(
                Math.abs(this.state.speed) /
                    this.maxForwardSpeed,
                0,
                1
            );

        const highSpeedReduction =
            THREE.MathUtils.lerp(
                1,
                this.minimumHighSpeedSteering,
                speedRatio
            );

        const targetSteeringAngle =
            steeringInput *
            this.maxSteeringAngle *
            highSpeedReduction;

        const steeringChangeSpeed =
            Math.abs(steeringInput) < 0.01
                ? this.steeringReturnSpeed
                : this.steeringSpeed;

        this.state.steeringAngle =
            this.moveTowards(
                this.state.steeringAngle,
                targetSteeringAngle,
                steeringChangeSpeed *
                    deltaTime
            );

    }

    // =========================================================
    // Heading and position
    // =========================================================

    updateHeading(deltaTime) {

        if (
            Math.abs(this.state.speed) <
                this.stopThreshold ||
            Math.abs(
                this.state.steeringAngle
            ) < 0.001
        ) {

            return;

        }

        const angularVelocity =
            (
                this.state.speed /
                this.wheelBase
            ) *
            Math.tan(
                this.state.steeringAngle
            );

        this.state.heading +=
            angularVelocity *
            deltaTime;

        this.state.heading =
            THREE.MathUtils.euclideanModulo(
                this.state.heading +
                    Math.PI,
                Math.PI * 2
            ) - Math.PI;

    }

    updatePosition(deltaTime) {

        const forwardDirection =
            this.state.getForwardDirection();

        const movementDistance =
            this.state.speed *
            deltaTime;

        this.state.position.addScaledVector(
            forwardDirection,
            movementDistance
        );

        if (
            typeof this.state.distanceTravelled !==
            "number"
        ) {

            this.state.distanceTravelled = 0;

        }

        this.state.distanceTravelled +=
            Math.abs(
                movementDistance
            );

    }

    // =========================================================
    // Gear
    // =========================================================

    updateGear() {

        if (
            this.state.speed >
            this.stopThreshold
        ) {

            this.state.gear = "D";

        }

        else if (
            this.state.speed <
            -this.stopThreshold
        ) {

            this.state.gear = "R";

        }

        else {

            this.state.gear = "N";

        }

    }

    // =========================================================
    // Collision support
    // =========================================================

    applyCollision(
        speedRetention = 0.35
    ) {

        const safeRetention =
            THREE.MathUtils.clamp(
                speedRetention,
                0,
                1
            );

        this.state.speed *=
            safeRetention;

        this.currentThrottle = 0;
        this.targetThrottle = 0;

        if (
            Math.abs(this.state.speed) <
            this.stopThreshold
        ) {

            this.state.speed = 0;

        }

    }

    applySpeedPenalty(
        multiplier = 0.7
    ) {

        const safeMultiplier =
            THREE.MathUtils.clamp(
                multiplier,
                0,
                1
            );

        this.state.speed *=
            safeMultiplier;

    }

    stopImmediately() {

        this.state.speed = 0;
        this.state.accelerationValue = 0;

        this.currentThrottle = 0;
        this.targetThrottle = 0;

    }

    // =========================================================
    // Utility
    // =========================================================

    moveTowards(
        current,
        target,
        maximumChange
    ) {

        if (
            Math.abs(
                target - current
            ) <= maximumChange
        ) {

            return target;

        }

        return (
            current +
            Math.sign(
                target - current
            ) *
            maximumChange
        );

    }

}