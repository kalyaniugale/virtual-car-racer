import * as THREE from "three";

export default class SteeringWheel {

    constructor() {

        this.group = new THREE.Group();

        this.initialize();

    }

    initialize() {

        this.createRim();
        this.createHub();
        this.createSpokes();

        // Position relative to camera
        this.group.position.set(
            0,
            -0.92,
            -1.25
        );

        // Steering wheel angle
        this.group.rotation.x = -0.35;

    }

    createRim() {

        const rim = new THREE.Mesh(

            new THREE.TorusGeometry(
                0.32,
                0.03,
                16,
                64
            ),

            new THREE.MeshStandardMaterial({

                color: 0x111111,
                metalness: 0.3,
                roughness: 0.7

            })

        );

        this.group.add(rim);

    }

    createHub() {

        const hub = new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.07,
                0.07,
                0.06,
                24
            ),

            new THREE.MeshStandardMaterial({

                color: 0x555555,
                metalness: 0.7,
                roughness: 0.3

            })

        );

        hub.rotation.x = Math.PI / 2;

        this.group.add(hub);

    }

    createSpokes() {

        const material = new THREE.MeshStandardMaterial({

            color: 0x444444,
            metalness: 0.5,
            roughness: 0.4

        });

        for (let i = 0; i < 3; i++) {

            const spoke = new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.05,
                    0.20,
                    0.02
                ),

                material

            );

            const angle =
                (i / 3) * Math.PI * 2;

            spoke.position.set(

                Math.cos(angle) * 0.12,

                Math.sin(angle) * 0.12,

                0

            );

            spoke.rotation.z = angle;

            this.group.add(spoke);

        }

    }

    getMesh() {

        return this.group;

    }

    update(deltaTime, vehicleState) {

        // Steering rotation
        this.group.rotation.z =
            -vehicleState.steeringAngle;

    }

}