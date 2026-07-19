import * as THREE from "three";

export default class LaneMarkings {
    constructor(scene, road) {
        this.scene = scene;
        this.road = road;

        this.lines = [];

        this.dashLength = 3;
        this.dashSpacing = 7;

        this.initialize();
    }

    initialize() {
        this.createCenterLines();
        this.createEdgeLines();
    }

    createCenterLines() {
        const curve = this.road.getCurve();
        const curveLength = curve.getLength();

        const dashCount = Math.floor(
            curveLength / this.dashSpacing
        );

        const geometry = new THREE.BoxGeometry(
            0.18,
            0.04,
            this.dashLength
        );

        const material =
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.7
            });

        for (let i = 0; i < dashCount; i++) {
            const t = i / dashCount;

            const point = curve.getPointAt(t);

            const tangent = curve
                .getTangentAt(t)
                .normalize();

            const line = new THREE.Mesh(
                geometry,
                material
            );

            line.position.set(
                point.x,
                0.055,
                point.z
            );

            line.rotation.y = Math.atan2(
                tangent.x,
                tangent.z
            );

            line.receiveShadow = true;

            this.scene.add(line);
            this.lines.push(line);
        }
    }

    createEdgeLines() {
        const curve = this.road.getCurve();
        const roadWidth = this.road.getRoadWidth();

        const edgeOffset =
            roadWidth / 2 - 0.3;

        this.createContinuousEdge(
            curve,
            edgeOffset
        );

        this.createContinuousEdge(
            curve,
            -edgeOffset
        );
    }

    createContinuousEdge(curve, offset) {
        const points = [];
        const sampleCount = 500;

        for (let i = 0; i <= sampleCount; i++) {
            const t = i / sampleCount;

            const point = curve.getPointAt(t);

            const tangent = curve
                .getTangentAt(t)
                .normalize();

            const sideDirection =
                new THREE.Vector3(
                    tangent.z,
                    0,
                    -tangent.x
                ).normalize();

            const edgePoint = point
                .clone()
                .addScaledVector(
                    sideDirection,
                    offset
                );

            edgePoint.y = 0.065;

            points.push(edgePoint);
        }

        const geometry =
            new THREE.BufferGeometry()
                .setFromPoints(points);

        const material =
            new THREE.LineBasicMaterial({
                color: 0xffffff
            });

        const lineLoop = new THREE.Line(
            geometry,
            material
        );

        this.scene.add(lineLoop);
    }

    update() {}
}