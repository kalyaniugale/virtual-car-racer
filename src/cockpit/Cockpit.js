import * as THREE from "three";

import Dashboard from "./Dashboard";
import Windshield from "./Windshield";
import SteeringWheel from "./SteeringWheel";


export default class Cockpit {

    constructor(camera) {

        this.camera = camera;

        // Everything in the cockpit is attached to this group
        this.group = new THREE.Group();

        this.camera.add(this.group);

        this.initialize();

    }

    initialize() {

        this.createDashboard();

        this.createWindshield();
        this.createSteeringWheel();
       
       
    }

    createDashboard() {

        this.dashboard = new Dashboard();

        this.group.add(this.dashboard.getMesh());

    }

    createWindshield() {

        this.windshield = new Windshield();

        this.group.add(this.windshield.getMesh());

    }

    createSteeringWheel() {

    this.steeringWheel =
        new SteeringWheel();

    this.group.add(
        this.steeringWheel.getMesh()
    );
    }



   


    update(deltaTime, vehicleState) {

        this.dashboard.update(deltaTime, vehicleState);

        this.windshield.update(deltaTime);

         this.steeringWheel.update(
            deltaTime,
            vehicleState
        );

    

        
    }

}