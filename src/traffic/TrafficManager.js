import * as THREE from "three";

import TrafficAssets from "./TrafficAssets";
import TrafficVehicle from "./TrafficVehicle";

export default class TrafficManager {

    constructor(
        scene,
        roadCurve
    ) {

        this.scene = scene;
        this.roadCurve = roadCurve;

        this.assets =
            new TrafficAssets();

        this.vehicles = [];

        this.ready = false;

        this.vehicleCount = 10;

        this.laneOffsets = [
            -2.2,
            2.2
        ];

        this.group =
            new THREE.Group();

        this.group.name =
            "TrafficVehicles";

        this.scene.add(
            this.group
        );

    }

    // =========================================================

    async initialize() {

        try {

            await this.assets.loadAll();

            this.spawnInitialTraffic();

            this.ready = true;

            console.log(
                "Traffic system initialized"
            );

        } catch (error) {

            this.ready = false;

            console.error(
                "Traffic initialization failed:",
                error
            );

        }

    }

    // =========================================================

    spawnInitialTraffic() {

        for (
            let index = 0;
            index < this.vehicleCount;
            index++
        ) {

            const progress =
                (
                    index /
                    this.vehicleCount
                ) +
                THREE.MathUtils.randFloat(
                    -0.025,
                    0.025
                );

            const safeProgress =
                THREE.MathUtils.euclideanModulo(
                    progress,
                    1
                );

            this.spawnVehicle(
                safeProgress
            );

        }

    }

    // =========================================================

    spawnVehicle(progress) {

        const asset =
            this.assets.createRandomVehicleModel();

        if (!asset) {

            return null;

        }

        const laneIndex =
            Math.floor(
                Math.random() *
                this.laneOffsets.length
            );

        const laneOffset =
            this.laneOffsets[
                laneIndex
            ];

        /*
         * All current traffic travels in the same direction.
         */
        const direction = 1;

        const speed =
            THREE.MathUtils.randFloat(
                asset.config.speedMin,
                asset.config.speedMax
            );

        const vehicle =
            new TrafficVehicle({
                mesh: asset.mesh,
                roadCurve: this.roadCurve,
                progress:
                    THREE.MathUtils.euclideanModulo(
                        progress,
                        1
                    ),
                laneOffset,
                speed,
                direction,
                modelRotationY: 0
            });

        vehicle.type =
            asset.config.name;

        vehicle.laneIndex =
            laneIndex;

        this.group.add(
            vehicle.mesh
        );

        this.vehicles.push(
            vehicle
        );

        return vehicle;

    }

    // =========================================================

    update(deltaTime) {

        if (!this.ready) {

            return;

        }

        for (const vehicle of this.vehicles) {

            vehicle.update(
                deltaTime
            );

        }

    }

    // =========================================================

    setVisible(visible) {

        this.group.visible =
            Boolean(visible);

    }

    getVehicles() {

        return this.vehicles;

    }

    // =========================================================

    clear() {

        for (const vehicle of this.vehicles) {

            vehicle.destroy();

        }

        this.vehicles.length = 0;

    }

    // =========================================================

    destroy() {

        this.clear();

        if (this.group.parent) {

            this.group.parent.remove(
                this.group
            );

        }

    }

}