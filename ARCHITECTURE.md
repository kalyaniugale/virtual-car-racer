# System Architecture

## Overview

Virtual Steering Wheel Racer is divided into independent modules.

```
                Webcam
                   │
                   ▼
        MediaPipe Gesture Recognition
                   │
                   ▼
           Steering Calculator
                   │
                   ▼
             Input Manager
                   │
                   ▼
             Vehicle Controller
                   │
                   ▼
              Vehicle Physics
                   │
          ┌────────┴─────────┐
          ▼                  ▼
     Vehicle State       Game State
          │                  │
          └────────┬─────────┘
                   ▼
              Three.js Scene
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
      World              Follow Camera
```

---

## Modules

### Game

Responsibilities

- Race states
- Timer
- Countdown
- HUD
- Main update loop

---

### Vehicle Physics

Responsibilities

- Acceleration
- Steering
- Braking
- Gear
- Collision response
- Cruise control

---

### Input Manager

Responsibilities

- Keyboard
- Gesture inputs
- Input smoothing

---

### MediaPipe

Responsibilities

- Gesture recognition
- Steering estimation

---

### World

Responsibilities

- Road
- Trees
- Buildings
- Lane markings

---

### Camera

Responsibilities

- Third-person follow
- Camera smoothing

---

## Update Loop

```
requestAnimationFrame
        │
        ▼
Game.update()
        │
        ▼
InputManager
        │
        ▼
VehicleController
        │
        ▼
VehiclePhysics
        │
        ▼
VehicleState
        │
        ▼
Camera
        │
        ▼
Renderer
```