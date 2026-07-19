import * as THREE from "three";

export default class Ground {
    constructor(scene) {
        this.scene = scene;

        this.geometry = null;
        this.material = null;
        this.mesh = null;

        this.initialize();
    }

    initialize() {
        this.geometry = this.createGeometry();
        this.material = this.createMaterial();
        this.mesh = this.createMesh();

        this.addToScene();
    }

    createGeometry() {
        return new THREE.PlaneGeometry(1000, 2000);
    }

    createMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x3f7d20
        });
    }

    createMesh() {
        const mesh = new THREE.Mesh(
            this.geometry,
            this.material
        );

        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;

        return mesh;
    }

    addToScene() {
        this.scene.add(this.mesh);
    }

    update(deltaTime) {}
}