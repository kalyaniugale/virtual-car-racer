import * as THREE from "three";

export default class Lights {
    constructor(scene) {
        this.scene = scene;

        this.createAmbientLight();
        this.createDirectionalLight();
    }

    createAmbientLight() {
        const ambientLight = new THREE.AmbientLight(
            0xffffff,
            1.5
        );

        this.scene.add(ambientLight);
    }

    createDirectionalLight() {
        const directionalLight = new THREE.DirectionalLight(
            0xffffff,
            2
        );

        directionalLight.position.set(10, 20, 10);

        directionalLight.castShadow = true;

        this.scene.add(directionalLight);
    }
}