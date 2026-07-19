import * as THREE from "three";

export default class Trees {
    constructor(scene, road) {
        this.scene = scene;
        this.road = road;

        this.trees = [];

        this.treeCount = 180;
        this.mapSize = 220;
        this.minimumRoadDistance = 10;

        this.greenColors = [
            0x1b5e20,
            0x2e7d32,
            0x388e3c,
            0x43a047,
            0x4caf50,
            0x66bb6a
        ];

        this.initialize();
    }

    initialize() {
        this.generateForest();
    }

    generateForest() {
        let created = 0;
        let attempts = 0;

        while (
            created < this.treeCount &&
            attempts < this.treeCount * 30
        ) {
            attempts++;

            const x =
                (Math.random() - 0.5) *
                this.mapSize;

            const z =
                (Math.random() - 0.5) *
                this.mapSize;

            if (
                this.road.distanceToRoad(x, z) <
                this.minimumRoadDistance
            ) {
                continue;
            }

            const tree = this.createTree();

            tree.position.set(x, 0, z);

            tree.rotation.y =
                Math.random() * Math.PI * 2;

            this.scene.add(tree);
            this.trees.push(tree);

            created++;
        }

        console.log(
            `Generated ${this.trees.length} trees`
        );
    }

    createTree() {
        const group = new THREE.Group();

        const scale =
            0.8 + Math.random() * 1.4;

        const trunkHeight =
            2.5 + Math.random() * 1.5;

        const trunkRadius =
            0.22 + Math.random() * 0.12;

        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(
                trunkRadius,
                trunkRadius * 1.3,
                trunkHeight,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x6d4c41
            })
        );

        trunk.position.y =
            trunkHeight / 2;

        trunk.castShadow = true;
        trunk.receiveShadow = true;

        group.add(trunk);

        const foliageColor =
            this.greenColors[
                Math.floor(
                    Math.random() *
                    this.greenColors.length
                )
            ];

        const cone1 = new THREE.Mesh(
            new THREE.ConeGeometry(
                1.8,
                3,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: foliageColor
            })
        );

        cone1.position.y =
            trunkHeight + 1.2;

        cone1.castShadow = true;

        group.add(cone1);

        const cone2 = new THREE.Mesh(
            new THREE.ConeGeometry(
                1.4,
                2.6,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: foliageColor
            })
        );

        cone2.position.y =
            trunkHeight + 2.8;

        cone2.castShadow = true;

        group.add(cone2);

        const cone3 = new THREE.Mesh(
            new THREE.ConeGeometry(
                1,
                2,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: foliageColor
            })
        );

        cone3.position.y =
            trunkHeight + 4.1;

        cone3.castShadow = true;

        group.add(cone3);

        group.scale.setScalar(scale);

        return group;
    }

    update(deltaTime, vehicleState) {
        // Static forest.
        // Trees never move.
    }
}