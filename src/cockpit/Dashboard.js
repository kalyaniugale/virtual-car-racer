import * as THREE from "three";

export default class Dashboard {

    constructor() {

        this.mesh = null;

        this.initialize();

    }

    initialize() {

        const geometry = new THREE.BoxGeometry(
            3.0,
            0.22,
            0.75
        );

        const material = new THREE.MeshStandardMaterial({

            color: 0x1b1b1b

        });

        this.mesh = new THREE.Mesh(
            geometry,
            material
        );

        // Position relative to the camera
        this.mesh.position.set(
            0,
            -1.15,
            -1.8
        );

    }

    getMesh() {

        return this.mesh;

    }

    update() {}

}