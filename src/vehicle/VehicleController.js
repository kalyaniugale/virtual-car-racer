import VehiclePhysics from "./VehiclePhysics";

export default class VehicleController {

    constructor(vehicleState, inputManager) {

        this.vehicleState = vehicleState;

        this.inputManager = inputManager;

        this.physics =
            new VehiclePhysics(
                this.vehicleState
            );

    }

    update(deltaTime) {

        this.inputManager.update();

        const inputState =
            this.inputManager.getState();

        this.physics.update(
            deltaTime,
            inputState
        );

    }

    //--------------------------------

    setAutoThrottle(enabled) {

        this.physics.setAutoThrottle(
            enabled
        );

    }

    //--------------------------------

    isAutoThrottleEnabled() {

        return this.physics.isAutoThrottleEnabled();

    }

}