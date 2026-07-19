import * as THREE from "three";

export default class Road {
    constructor(scene) {
        this.scene = scene;

        this.roadWidth = 10;
        this.vehicleHalfWidth = 1;

        this.curveSegments = 500;
        this.constraintSamples = 700;

        this.curve = null;
        this.mesh = null;
        this.roadSamples = [];

        this.initialize();
    }

    initialize() {
        this.createCurve();
        this.createRoadMesh();
        this.createRoadSamples();
    }

    createCurve() {
        const points = [
            new THREE.Vector3(-55, 0, -45),
            new THREE.Vector3(0, 0, -60),
            new THREE.Vector3(55, 0, -45),

            new THREE.Vector3(65, 0, 0),

            new THREE.Vector3(55, 0, 45),
            new THREE.Vector3(0, 0, 60),
            new THREE.Vector3(-55, 0, 45),

            new THREE.Vector3(-65, 0, 0)
        ];

        this.curve = new THREE.CatmullRomCurve3(
            points,
            true,
            "centripetal"
        );

        this.curve.closed = true;
    }

    createRoadMesh() {
        const vertices = [];
        const indices = [];
        const uvs = [];

        const halfWidth = this.roadWidth / 2;

        for (let i = 0; i <= this.curveSegments; i++) {
            const t = i / this.curveSegments;

            const point = this.curve.getPointAt(t);

            const tangent = this.curve
                .getTangentAt(t)
                .normalize();

            const sideDirection = new THREE.Vector3(
                tangent.z,
                0,
                -tangent.x
            ).normalize();

            const leftPoint = point
                .clone()
                .addScaledVector(sideDirection, halfWidth);

            const rightPoint = point
                .clone()
                .addScaledVector(sideDirection, -halfWidth);

            vertices.push(
                leftPoint.x,
                0.02,
                leftPoint.z
            );

            vertices.push(
                rightPoint.x,
                0.02,
                rightPoint.z
            );

            uvs.push(
                0,
                i / this.curveSegments
            );

            uvs.push(
                1,
                i / this.curveSegments
            );
        }

        for (let i = 0; i < this.curveSegments; i++) {
            const currentLeft = i * 2;
            const currentRight = currentLeft + 1;

            const nextLeft = currentLeft + 2;
            const nextRight = currentLeft + 3;

            indices.push(
                currentLeft,
                currentRight,
                nextLeft
            );

            indices.push(
                currentRight,
                nextRight,
                nextLeft
            );
        }

        const geometry = new THREE.BufferGeometry();

        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(
                vertices,
                3
            )
        );

        geometry.setAttribute(
            "uv",
            new THREE.Float32BufferAttribute(
                uvs,
                2
            )
        );

        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.95,
            metalness: 0,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(
            geometry,
            material
        );

        this.mesh.receiveShadow = true;

        this.scene.add(this.mesh);
    }

    createRoadSamples() {
        this.roadSamples = [];

        for (
            let i = 0;
            i < this.constraintSamples;
            i++
        ) {
            const t = i / this.constraintSamples;

            const point = this.curve.getPointAt(t);

            const tangent = this.curve
                .getTangentAt(t)
                .normalize();

            const normal = new THREE.Vector3(
                tangent.z,
                0,
                -tangent.x
            ).normalize();

            this.roadSamples.push({
                t,
                point,
                tangent,
                normal
            });
        }
    }

    getClosestRoadInfo(position) {
        let closestSample = null;
        let closestDistanceSquared = Infinity;

        for (const sample of this.roadSamples) {
            const dx =
                position.x - sample.point.x;

            const dz =
                position.z - sample.point.z;

            const distanceSquared =
                dx * dx + dz * dz;

            if (
                distanceSquared <
                closestDistanceSquared
            ) {
                closestDistanceSquared =
                    distanceSquared;

                closestSample = sample;
            }
        }

        if (!closestSample) {
            return null;
        }

        const offsetVector = new THREE.Vector3(
            position.x - closestSample.point.x,
            0,
            position.z - closestSample.point.z
        );

        const lateralOffset = offsetVector.dot(
            closestSample.normal
        );

        return {
            point: closestSample.point,
            tangent: closestSample.tangent,
            normal: closestSample.normal,
            t: closestSample.t,
            lateralOffset,
            distance: Math.sqrt(
                closestDistanceSquared
            )
        };
    }

    constrainVehicle(vehicleState) {
        const roadInfo = this.getClosestRoadInfo(
            vehicleState.position
        );

        if (!roadInfo) {
            return;
        }

        const maximumOffset =
            this.roadWidth / 2 -
            this.vehicleHalfWidth;

        const constrainedOffset =
            THREE.MathUtils.clamp(
                roadInfo.lateralOffset,
                -maximumOffset,
                maximumOffset
            );

        vehicleState.position.x =
            roadInfo.point.x +
            roadInfo.normal.x *
                constrainedOffset;

        vehicleState.position.z =
            roadInfo.point.z +
            roadInfo.normal.z *
                constrainedOffset;

        vehicleState.position.y = 0;

        const outsideRoad =
            Math.abs(
                roadInfo.lateralOffset
            ) > maximumOffset;

        if (outsideRoad) {
            vehicleState.speed *= 0.92;
        }
    }

    getStartPosition() {
        return this.curve
            .getPointAt(0)
            .clone();
    }

    getStartHeading() {
        const tangent = this.curve
            .getTangentAt(0)
            .normalize();

        return Math.atan2(
            tangent.x,
            -tangent.z
        );
    }

    distanceToRoad(x, z) {
        const position = new THREE.Vector3(
            x,
            0,
            z
        );

        const roadInfo =
            this.getClosestRoadInfo(position);

        if (!roadInfo) {
            return Infinity;
        }

        return Math.abs(
            roadInfo.lateralOffset
        );
    }

    getCurve() {
        return this.curve;
    }

    getRoadWidth() {
        return this.roadWidth;
    }

    update() {}
}