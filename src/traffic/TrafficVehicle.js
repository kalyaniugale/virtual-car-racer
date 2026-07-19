import * as THREE from "three";

export default class TrafficVehicle {

    constructor({
        mesh,
        roadCurve,
        progress = 0,
        laneOffset = 0,
        speed = 8,
        direction = 1,
        modelRotationY = Math.PI
    }) {

        this.mesh = mesh;
        this.roadCurve = roadCurve;

        this.progress = progress;
        this.laneOffset = laneOffset;
        this.speed = speed;

        /*
         * 1  = normal spline direction
         * -1 = opposite spline direction
         */
        this.direction =
            direction >= 0 ? 1 : -1;

        this.modelRotationY =
            modelRotationY;

        this.roadLength =
            this.roadCurve.getLength();

        this.active = true;

        this.position =
            new THREE.Vector3();

        this.tangent =
            new THREE.Vector3();

        this.sideDirection =
            new THREE.Vector3();

        this.forwardDirection =
            new THREE.Vector3();

        this.up =
            new THREE.Vector3(
                0,
                1,
                0
            );

        this.lookTarget =
            new THREE.Vector3();

        this.updateTransform();

    }

    // =========================================================

    update(deltaTime) {

        if (!this.active) {

            return;

        }

        const safeDeltaTime =
            THREE.MathUtils.clamp(
                Number(deltaTime) || 0,
                0,
                0.1
            );

        const normalizedMovement =
            (
                this.speed *
                safeDeltaTime
            ) /
            Math.max(
                this.roadLength,
                0.0001
            );

        this.progress +=
            normalizedMovement *
            this.direction;

        this.progress =
            THREE.MathUtils.euclideanModulo(
                this.progress,
                1
            );

        this.updateTransform();

    }

    // =========================================================

    updateTransform() {

        const safeProgress =
            THREE.MathUtils.euclideanModulo(
                this.progress,
                1
            );

        this.roadCurve.getPointAt(
            safeProgress,
            this.position
        );

        this.roadCurve.getTangentAt(
            safeProgress,
            this.tangent
        );

        this.tangent.normalize();

        this.sideDirection
            .crossVectors(
                this.up,
                this.tangent
            )
            .normalize();

        this.position.addScaledVector(
            this.sideDirection,
            this.laneOffset
        );

        this.position.y += 0.05;

        this.mesh.position.copy(
            this.position
        );

        this.forwardDirection
            .copy(this.tangent)
            .multiplyScalar(
                this.direction
            )
            .normalize();

        this.lookTarget
            .copy(this.position)
            .add(
                this.forwardDirection
            );

        this.mesh.lookAt(
            this.lookTarget
        );

        this.mesh.rotateY(
            this.modelRotationY
        );

        /*
         * Ensure Box3 receives the current world transform
         * before collision detection occurs.
         */
        this.mesh.updateMatrixWorld(
            true
        );

    }

    // =========================================================

    getForwardDirection(target = new THREE.Vector3()) {

        return target
            .copy(this.forwardDirection)
            .normalize();

    }

    getVelocity(target = new THREE.Vector3()) {

        return target
            .copy(this.forwardDirection)
            .multiplyScalar(
                this.speed
            );

    }

    // =========================================================

    setSpeed(speed) {

        this.speed =
            Math.max(
                Number(speed) || 0,
                0
            );

    }

    setLaneOffset(offset) {

        this.laneOffset =
            Number(offset) || 0;

    }

    // =========================================================

    destroy() {

        this.active = false;

        if (this.mesh.parent) {

            this.mesh.parent.remove(
                this.mesh
            );

        }

        this.mesh.traverse((child) => {

            if (!child.isMesh) {

                return;

            }

            if (child.geometry) {

                child.geometry.dispose();

            }

            if (child.material) {

                if (
                    Array.isArray(
                        child.material
                    )
                ) {

                    child.material.forEach(
                        (material) => {

                            material.dispose();

                        }
                    );

                } else {

                    child.material.dispose();

                }

            }

        });

    }

}