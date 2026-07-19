import * as THREE from "three";

export default class InstrumentPanel {

    constructor() {

        this.group = new THREE.Group();

        this.initialize();

    }

    initialize() {

        this.createBase();

        this.createHood();

    }

    createBase() {

        const base = new THREE.Mesh(

            new THREE.BoxGeometry(
                1.25,
                0.42,
                0.18
            ),

            new THREE.MeshStandardMaterial({

                color: 0x181818

            })

        );

        this.group.add(base);

    }

    createHood() {

        const hood = new THREE.Mesh(

            new THREE.BoxGeometry(
                1.30,
                0.12,
                0.40
            ),

            new THREE.MeshStandardMaterial({

                color: 0x121212

            })

        );

        hood.position.set(
            0,
            0.22,
            -0.10
        );

        hood.rotation.x = -0.3;

        this.group.add(hood);

    }

    getMesh() {

        return this.group;

    }

    update() {}

}