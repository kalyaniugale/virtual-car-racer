import * as THREE from "three";

export default class Windshield {

    constructor() {

        this.mesh = null;

        this.initialize();

    }

    initialize() {

        const geometry = new THREE.PlaneGeometry(
            2.8,
            1.8
        );

        const material = new THREE.MeshBasicMaterial({

            color: 0xaedcff,

            transparent: true,

            opacity: 0.03,

            side: THREE.DoubleSide

        });

        this.mesh = new THREE.Mesh(
            geometry,
            material
        );

        this.mesh.position.set(
            0,
            0.2,
            -2.1
        );

    }

    getMesh() {

        return this.mesh;

    }

    update() {}

}