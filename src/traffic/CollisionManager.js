import * as THREE from "three";

export default class CollisionManager {

    constructor(vehicleState) {

        this.vehicleState = vehicleState;

        // Approximate physical size of the player's car.
        this.playerSize = new THREE.Vector3(
            1.8, // Width
            1.6, // Height
            4.2  // Length
        );

        this.playerBox = new THREE.Box3();
        this.trafficBox = new THREE.Box3();

        this.playerCenter = new THREE.Vector3();
        this.toTraffic = new THREE.Vector3();

        this.playerForward = new THREE.Vector3();
        this.trafficForward = new THREE.Vector3();

        /*
         * Stores vehicles currently overlapping the player.
         * This prevents the same collision from triggering
         * continuously every frame.
         */
        this.currentOverlaps = new Set();

        // Minimum speed difference for a rear impact.
        this.rearImpactSpeedThreshold = 0.25;

        /*
         * Dot-product thresholds:
         *
         *  1   = directly in front
         *  0   = directly beside
         * -1   = directly behind
         */
        this.behindThreshold = -0.25;

        /*
         * Vehicles must face approximately the same direction
         * before the collision can be classified as a rear hit.
         */
        this.sameDirectionThreshold = 0.5;

    }

    // =========================================================
    // Public collision check
    // =========================================================

    checkCollision(trafficVehicles = []) {

        if (
            !this.vehicleState ||
            !this.vehicleState.position
        ) {

            return null;

        }

        this.updatePlayerBox();

        const activeIntersections = new Set();

        for (const vehicle of trafficVehicles) {

            if (
                !vehicle ||
                !vehicle.active ||
                !vehicle.mesh
            ) {

                continue;

            }

            this.trafficBox.setFromObject(
                vehicle.mesh
            );

            const intersects =
                this.playerBox.intersectsBox(
                    this.trafficBox
                );

            if (!intersects) {

                continue;

            }

            activeIntersections.add(vehicle);

            /*
             * Do not process the same contact repeatedly
             * until both vehicles separate.
             */
            if (this.currentOverlaps.has(vehicle)) {

                continue;

            }

            const collisionInfo =
                this.classifyCollision(vehicle);

            this.currentOverlaps.add(vehicle);

            if (
                collisionInfo.type ===
                "REAR_HIT_BY_TRAFFIC"
            ) {

                console.log(
                    "Rear collision ignored:",
                    collisionInfo
                );

                continue;

            }

            return collisionInfo;

        }

        /*
         * Remove vehicles that are no longer touching
         * the player's collision box.
         */
        for (const vehicle of this.currentOverlaps) {

            if (!activeIntersections.has(vehicle)) {

                this.currentOverlaps.delete(
                    vehicle
                );

            }

        }

        return null;

    }

    // =========================================================
    // Player collision box
    // =========================================================

    updatePlayerBox() {

        this.playerCenter.copy(
            this.vehicleState.position
        );

        /*
         * VehicleState.position is located at road level.
         * Raise the box so that it surrounds the car body.
         */
        this.playerCenter.y +=
            this.playerSize.y * 0.5;

        this.playerBox.setFromCenterAndSize(
            this.playerCenter,
            this.playerSize
        );

    }

    // =========================================================
    // Collision classification
    // =========================================================

    classifyCollision(vehicle) {

        this.playerForward.copy(
            this.vehicleState.getForwardDirection()
        );

        this.playerForward.y = 0;

        if (
            this.playerForward.lengthSq() <
            0.0001
        ) {

            this.playerForward.set(
                0,
                0,
                -1
            );

        }

        this.playerForward.normalize();

        this.toTraffic
            .subVectors(
                vehicle.mesh.position,
                this.vehicleState.position
            );

        this.toTraffic.y = 0;

        if (
            this.toTraffic.lengthSq() >
            0.0001
        ) {

            this.toTraffic.normalize();

        }

        /*
         * Negative means the traffic vehicle is behind
         * the player.
         */
        const longitudinalPosition =
            this.playerForward.dot(
                this.toTraffic
            );

        this.getTrafficForward(
            vehicle,
            this.trafficForward
        );

        const directionAlignment =
            this.playerForward.dot(
                this.trafficForward
            );

        const playerForwardSpeed =
            Number(
                this.vehicleState.speed
            ) || 0;

        const trafficForwardSpeed =
            this.getTrafficVelocityAlongPlayerForward(
                vehicle
            );

        const trafficClosingSpeed =
            trafficForwardSpeed -
            playerForwardSpeed;

        const trafficIsBehind =
            longitudinalPosition <
            this.behindThreshold;

        const travellingSameDirection =
            directionAlignment >
            this.sameDirectionThreshold;

        const trafficIsClosingFromBehind =
            trafficClosingSpeed >
            this.rearImpactSpeedThreshold;

        /*
         * Ignore only when:
         *
         * 1. Traffic is behind the player.
         * 2. Both vehicles travel in approximately the same direction.
         * 3. Traffic is moving faster and closing into the player.
         * 4. Player is not reversing into the traffic vehicle.
         */
        const rearHitByTraffic =
            trafficIsBehind &&
            travellingSameDirection &&
            trafficIsClosingFromBehind &&
            playerForwardSpeed >= 0;

        if (rearHitByTraffic) {

            return {
                type: "REAR_HIT_BY_TRAFFIC",
                shouldEndRace: false,
                vehicle,
                longitudinalPosition,
                directionAlignment,
                playerSpeed: playerForwardSpeed,
                trafficSpeed: trafficForwardSpeed,
                closingSpeed: trafficClosingSpeed
            };

        }

        const impactType =
            this.getImpactType(
                longitudinalPosition
            );

        return {
            type: impactType,
            shouldEndRace: true,
            vehicle,
            longitudinalPosition,
            directionAlignment,
            playerSpeed: playerForwardSpeed,
            trafficSpeed: trafficForwardSpeed,
            closingSpeed: trafficClosingSpeed
        };

    }

    // =========================================================

    getImpactType(longitudinalPosition) {

        if (longitudinalPosition > 0.35) {

            return "FRONT_COLLISION";

        }

        if (longitudinalPosition < -0.35) {

            /*
             * This occurs when the player reverses into
             * a vehicle or otherwise causes the rear impact.
             */
            return "PLAYER_REAR_COLLISION";

        }

        return "SIDE_COLLISION";

    }

    // =========================================================

    getTrafficForward(
        vehicle,
        target
    ) {

        if (
            typeof vehicle.getForwardDirection ===
            "function"
        ) {

            vehicle.getForwardDirection(
                target
            );

            target.y = 0;

            if (target.lengthSq() > 0.0001) {

                return target.normalize();

            }

        }

        if (vehicle.tangent) {

            target.copy(
                vehicle.tangent
            );

            target.multiplyScalar(
                vehicle.direction || 1
            );

            target.y = 0;

            if (target.lengthSq() > 0.0001) {

                return target.normalize();

            }

        }

        vehicle.mesh.getWorldDirection(
            target
        );

        target.y = 0;

        if (target.lengthSq() < 0.0001) {

            target.set(
                0,
                0,
                -1
            );

        }

        return target.normalize();

    }

    // =========================================================

    getTrafficVelocityAlongPlayerForward(
        vehicle
    ) {

        this.getTrafficForward(
            vehicle,
            this.trafficForward
        );

        const trafficSpeed =
            Math.max(
                Number(vehicle.speed) || 0,
                0
            );

        return (
            this.trafficForward.dot(
                this.playerForward
            ) *
            trafficSpeed
        );

    }

    // =========================================================

    reset() {

        this.currentOverlaps.clear();

        this.playerBox.makeEmpty();
        this.trafficBox.makeEmpty();

    }

}