import * as THREE from "three";

export default class Camera {

    constructor() {

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Driver eye height
        this.driverHeight = 1.5;

        // Camera is inside the cockpit
        this.forwardOffset = 0.35;

        // Smooth movement
        this.positionLerp = 0.12;
        this.rotationLerp = 0.12;

        this.currentLookTarget = new THREE.Vector3();

    }

    update(vehicleState) {

        if (!vehicleState) return;

        //--------------------------------------------------
        // Vehicle position
        //--------------------------------------------------

        const vehiclePos = vehicleState.position;

        //--------------------------------------------------
        // Forward direction
        //--------------------------------------------------

        const forward = vehicleState.getForwardDirection();

        //--------------------------------------------------
        // Camera position
        //--------------------------------------------------

        const targetPosition = new THREE.Vector3(
            vehiclePos.x,
            this.driverHeight,
            vehiclePos.z
        );

        targetPosition.addScaledVector(
            forward,
            this.forwardOffset
        );

        this.camera.position.lerp(
            targetPosition,
            this.positionLerp
        );

        //--------------------------------------------------
        // Look ahead
        //--------------------------------------------------

        const lookTarget = vehiclePos.clone();

        lookTarget.y = this.driverHeight;

        lookTarget.addScaledVector(
            forward,
            20
        );

        this.currentLookTarget.lerp(
            lookTarget,
            this.rotationLerp
        );

        this.camera.lookAt(this.currentLookTarget);

    }

    getCamera() {

        return this.camera;

    }

    updateAspectRatio(width, height) {

        this.camera.aspect = width / height;

        this.camera.updateProjectionMatrix();

    }

}