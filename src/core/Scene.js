import * as THREE from "three";

export default class Scene {
    constructor() {
        this.scene = new THREE.Scene();

        // Sky color
        this.scene.background = new THREE.Color(0x87ceeb);
    }

    getScene() {
        return this.scene;
    }
}