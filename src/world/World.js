import Ground from "./Ground";
import Road from "./Road";
import Sky from "./Sky";
import LaneMarkings from "./LaneMarkings";
import Trees from "./Trees";
import Buildings from "./Buildings";

export default class World {
    constructor(scene) {
        this.scene = scene;

        this.initialize();
    }

    initialize() {
        this.createGround();
        this.createRoad();
        this.createLaneMarkings();
        this.createSky();
        this.createTrees();
        this.createBuildings();
    }

    createGround() {
        this.ground = new Ground(this.scene);
    }

    createRoad() {
        this.road = new Road(this.scene);
    }

    createLaneMarkings() {
        this.laneMarkings = new LaneMarkings(
            this.scene,
            this.road
        );
    }

    createSky() {
        this.sky = new Sky(this.scene);
    }

    createTrees() {
        this.trees = new Trees(
            this.scene,
            this.road
        );
    }

    createBuildings() {
        this.buildings = new Buildings(
            this.scene,
            this.road
        );
    }
    getRoadCurve() {
    return this.road.getCurve();
}

getRoad() {
    return this.road;
}

    update(deltaTime, vehicleState) {

        this.ground.update(deltaTime);

        this.road.update(deltaTime);

        this.laneMarkings.update(
            deltaTime,
            vehicleState
        );

        this.trees.update(
            deltaTime,
            vehicleState
        );

        this.buildings.update(
            deltaTime,
            vehicleState
        );

        this.sky.update(deltaTime);

        // Keep the vehicle inside the road boundaries
        this.road.constrainVehicle(vehicleState);
    }
}