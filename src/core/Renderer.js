import * as THREE from "three";

export default class Renderer {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        // Match browser window size
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Better visuals on high-DPI displays
        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );

        // Prepare for future shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        document.body.appendChild(this.renderer.domElement);
    }

    render(scene, camera) {
        this.renderer.render(scene, camera);
    }

    resize(width, height) {
        this.renderer.setSize(width, height);
    }

    getRenderer() {
        return this.renderer;
    }
}