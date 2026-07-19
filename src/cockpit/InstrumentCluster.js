import * as THREE from "three";

export default class InstrumentCluster {

    constructor() {

        this.group = new THREE.Group();

        this.initialize();

    }

    initialize() {

        this.createPanel();

        this.createGaugeHousings();

        this.group.position.set(
            0,
            -0.72,
            -1.65
        );

    }

    createPanel() {

        const panel = new THREE.Mesh(

            new THREE.BoxGeometry(
                1.2,
                0.45,
                0.12
            ),

            new THREE.MeshStandardMaterial({

                color: 0x202020

            })

        );

        this.group.add(panel);

    }

    createGaugeHousings() {

        const material = new THREE.MeshStandardMaterial({

            color: 0x111111

        });

        const geometry = new THREE.CylinderGeometry(
            0.12,
            0.12,
            0.05,
            32
        );

        const left = new THREE.Mesh(
            geometry,
            material
        );

        left.rotation.x = Math.PI / 2;

        left.position.set(
            -0.25,
            0.05,
            0.07
        );

        this.group.add(left);

        const right = left.clone();

        right.position.x = 0.25;

        this.group.add(right);

    }

    getMesh() {

        return this.group;

    }

    update() {}

}