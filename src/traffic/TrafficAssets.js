import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class TrafficAssets {

    constructor() {

        this.loader = new GLTFLoader();

        this.models = new Map();

        this.modelPaths = [
            {
                name: "sedan",
                path: "/models/sedan.glb",
                scale: 1,
                speedMin: 7,
                speedMax: 11
            },
            {
                name: "sedan-sports",
                path: "/models/sedan-sports.glb",
                scale: 1,
                speedMin: 9,
                speedMax: 13
            },
            {
                name: "suv",
                path: "/models/suv.glb",
                scale: 1,
                speedMin: 7,
                speedMax: 10
            },
            {
                name: "suv-luxury",
                path: "/models/suv-luxury.glb",
                scale: 1,
                speedMin: 8,
                speedMax: 11
            },
            {
                name: "taxi",
                path: "/models/taxi.glb",
                scale: 1,
                speedMin: 7,
                speedMax: 11
            },
            {
                name: "van",
                path: "/models/van.glb",
                scale: 1,
                speedMin: 6,
                speedMax: 9
            },
            {
                name: "delivery",
                path: "/models/delivery.glb",
                scale: 1,
                speedMin: 5,
                speedMax: 8
            },
            {
                name: "truck",
                path: "/models/truck.glb",
                scale: 1,
                speedMin: 4,
                speedMax: 7
            },
            {
                name: "garbage-truck",
                path: "/models/garbage-truck.glb",
                scale: 1,
                speedMin: 4,
                speedMax: 6
            },
            {
                name: "ambulance",
                path: "/models/ambulance.glb",
                scale: 1,
                speedMin: 9,
                speedMax: 13
            },
            {
                name: "police",
                path: "/models/police.glb",
                scale: 1,
                speedMin: 9,
                speedMax: 13
            }
        ];

        this.loaded = false;

    }

    // =========================================================

    async loadAll() {

        const tasks = this.modelPaths.map(
            (modelConfig) =>
                this.loadModel(modelConfig)
        );

        await Promise.all(tasks);

        this.loaded = true;

        console.log(
            `Traffic models loaded: ${this.models.size}`
        );

    }

    // =========================================================

    loadModel(modelConfig) {

        return new Promise(
            (resolve, reject) => {

                this.loader.load(

                    modelConfig.path,

                    (gltf) => {

                        const model =
                            gltf.scene;

                        model.scale.setScalar(
                            modelConfig.scale
                        );

                        model.traverse((child) => {

                            if (child.isMesh) {

                                child.castShadow = true;
                                child.receiveShadow = true;

                            }

                        });

                        this.models.set(
                            modelConfig.name,
                            {
                                model,
                                config: modelConfig
                            }
                        );

                        resolve();

                    },

                    undefined,

                    (error) => {

                        console.error(
                            `Failed to load ${modelConfig.path}`,
                            error
                        );

                        reject(error);

                    }

                );

            }
        );

    }

    // =========================================================

    createRandomVehicleModel() {

        if (
            !this.loaded ||
            this.models.size === 0
        ) {

            return null;

        }

        const availableModels =
            Array.from(
                this.models.values()
            );

        const randomIndex =
            Math.floor(
                Math.random() *
                availableModels.length
            );

        const selected =
            availableModels[randomIndex];

        const clone =
            selected.model.clone(true);

        clone.traverse((child) => {

            if (
                child.isMesh &&
                child.material
            ) {

                /*
                 * Clone materials so changing one traffic
                 * vehicle later does not affect all vehicles.
                 */
                child.material =
                    child.material.clone();

            }

        });

        return {
            mesh: clone,
            config: selected.config
        };

    }

}