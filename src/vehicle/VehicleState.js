import * as THREE from "three";

export default class VehicleState {

    constructor() {

        // Start on the lower-left section of the road.
        this.position = new THREE.Vector3(
            -50,
            0,
            -50
        );

        // Face toward the positive X direction.
        this.heading = Math.PI / 2;

        // Movement
        this.speed = 0;
        this.accelerationValue = 0;

        // Steering
        this.steeringAngle = 0;

        // Vehicle status
        this.gear = "N";
        this.engineRunning = true;

        // Gameplay values
        this.distanceTravelled = 0;
    }

    getSpeedKmh() {
        return Math.abs(this.speed) * 3.6;
    }

    getForwardDirection() {

        return new THREE.Vector3(
            Math.sin(this.heading),
            0,
            -Math.cos(this.heading)
        );

    }

}