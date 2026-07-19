import * as THREE from "three";

export default class DigitalDisplay {

    constructor() {

        this.canvas = document.createElement("canvas");
        this.canvas.width = 512;
        this.canvas.height = 256;

        this.ctx = this.canvas.getContext("2d");

        this.texture = new THREE.CanvasTexture(this.canvas);

        this.material = new THREE.MeshBasicMaterial({

            map: this.texture,
            transparent: true

        });

        this.mesh = new THREE.Mesh(

            new THREE.PlaneGeometry(
                0.38,
                0.18
            ),

            this.material

        );

        // Position on dashboard
        this.mesh.position.set(
            0.75,   // right side
           -0.05,
           0.10
        );

        this.distance = 0;

        this.draw(0, "N");

    }

    draw(speed, gear) {

        const ctx = this.ctx;

        ctx.clearRect(0, 0, 512, 256);

        // Screen
        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, 512, 256);

        // Border
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 504, 248);

        // Speed
        ctx.fillStyle = "#00ff88";
        ctx.font = "bold 28px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            `${Math.round(speed)} km/h`,
            256,
            95
        );

        // Gear
        ctx.font = "18px Arial";

        ctx.fillText(
            `Gear : ${gear}`,
            256,
            165
        );

        // Distance
        ctx.font = "14px Arial";

        ctx.fillStyle = "#ffffff";

        ctx.fillText(
            `Distance : ${this.distance.toFixed(2)} km`,
            256,
            220
        );

        this.texture.needsUpdate = true;

    }

    getMesh() {

        return this.mesh;

    }

    update(deltaTime, vehicleState) {

        this.distance +=
            vehicleState.speed *
            deltaTime /
            1000;

        let gear = "N";

        if (vehicleState.speed > 0.5)
            gear = "D";

        if (vehicleState.speed < -0.5)
            gear = "R";

        this.draw(
            vehicleState.getSpeedKmh(),
            gear
        );

    }

}