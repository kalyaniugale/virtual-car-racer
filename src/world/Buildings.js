import * as THREE from "three";

export default class Buildings {
    constructor(scene, road) {
        this.scene = scene;
        this.road = road;

        this.buildings = [];

        this.buildingCount = 45;
        this.mapSize = 220;
        this.minimumRoadDistance = 18;

        this.wallColors = [
            0xe0e0e0,
            0xd6d6d6,
            0xc5cae9,
            0xb0bec5,
            0xd7ccc8,
            0xbcaaa4,
            0xffecb3,
            0xf5f5f5
        ];

        this.initialize();
    }

    initialize() {
        this.generateBuildings();
    }

    generateBuildings() {
        let created = 0;
        let attempts = 0;

        while (
            created < this.buildingCount &&
            attempts < this.buildingCount * 40
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

            const building = this.createBuilding();

            building.position.set(x, 0, z);

            building.rotation.y =
                Math.random() * Math.PI * 2;

            this.scene.add(building);

            this.buildings.push(building);

            created++;
        }

        console.log(
            `Generated ${this.buildings.length} buildings`
        );
    }

    createBuilding() {

        const group = new THREE.Group();

        const width =
            4 + Math.random() * 5;

        const depth =
            4 + Math.random() * 5;

        const floors =
            2 + Math.floor(Math.random() * 8);

        const height =
            floors * 3;

        const wallColor =
            this.wallColors[
                Math.floor(
                    Math.random() *
                    this.wallColors.length
                )
            ];

        const body = new THREE.Mesh(

            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),

            new THREE.MeshStandardMaterial({

                color: wallColor

            })

        );

        body.position.y = height / 2;

        body.castShadow = true;
        body.receiveShadow = true;

        group.add(body);

        //------------------------------------
        // Roof
        //------------------------------------

        const roof = new THREE.Mesh(

            new THREE.BoxGeometry(
                width + 0.3,
                0.4,
                depth + 0.3
            ),

            new THREE.MeshStandardMaterial({

                color: 0x616161

            })

        );

        roof.position.y =
            height + 0.2;

        roof.castShadow = true;

        group.add(roof);

        //------------------------------------
        // Windows
        //------------------------------------

        const windowMaterial =
            new THREE.MeshStandardMaterial({

                color: 0x90caf9,
                emissive: 0x1e88e5,
                emissiveIntensity: 0.15

            });

        const windowGeometry =
            new THREE.BoxGeometry(
                0.45,
                0.7,
                0.05
            );

        const rows = floors;

        const columns =
            Math.max(
                2,
                Math.floor(width)
            );

        for (
            let floor = 0;
            floor < rows;
            floor++
        ) {

            for (
                let col = 0;
                col < columns;
                col++
            ) {

                const windowMesh =
                    new THREE.Mesh(
                        windowGeometry,
                        windowMaterial
                    );

                windowMesh.position.x =
                    -width / 2 +
                    1 +
                    col *
                        (
                            (width - 2) /
                            (columns - 1)
                        );

                windowMesh.position.y =
                    1.4 +
                    floor * 3;

                windowMesh.position.z =
                    depth / 2 + 0.03;

                group.add(windowMesh);

                const backWindow =
                    windowMesh.clone();

                backWindow.position.z =
                    -depth / 2 - 0.03;

                backWindow.rotation.y =
                    Math.PI;

                group.add(backWindow);
            }
        }

        return group;
    }

    update(deltaTime, vehicleState) {

        // Static world.
        // Buildings never move.

    }
}