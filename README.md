# 🏎️ Virtual Steering Wheel Racer

A browser-based driving simulator that lets users control a virtual car using **real-time hand gestures** instead of a physical steering wheel.

The project combines **Three.js**, **MediaPipe Gesture Recognition**, and custom vehicle physics to create an immersive gesture-controlled driving experience.

---

# Features

## Gesture-Based Controls

The car is controlled entirely using hand gestures.

| Gesture | Action |
|----------|--------|
| 👍 Thumbs Up | Start / Resume Race |
| ✋ Open Palm | Pause Race |
| 👎 Thumbs Down | Finish Race |
| 👊 Steering Gestures | Steering Wheel Control |

*(Additional gestures like Fist = Brake and Speed Boost are planned.)*

---

# Vehicle Physics

A custom vehicle physics engine has been implemented instead of using an external physics library.

Current capabilities include:

- Smooth acceleration
- Automatic cruise control
- Progressive throttle
- Reverse gear
- Braking
- Handbrake
- Rolling resistance
- Speed-dependent steering
- Bicycle steering model
- Gear detection (D / N / R)
- Collision slowdown support
- Off-road slowdown support (ready)
- Cruise speed controller

---

# Game Flow

The game follows a gesture-driven state machine.

```
Waiting
   │
   ▼
Thumbs Up
   │
   ▼
Countdown
   │
   ▼
Playing
   │
   ├── Open Palm
   │        │
   │        ▼
   │      Paused
   │        │
   │        ▼
   │   Thumbs Up
   │
   ▼
Thumbs Down
   │
   ▼
Finished
```

---

# Environment

The game world currently contains:

- Procedural road
- Lane markings
- Trees
- Buildings
- Follow camera
- Infinite driving environment

---

# Technologies

- JavaScript (ES6)
- Three.js
- MediaPipe Tasks Vision
- Vite
- HTML
- CSS

---

# Project Structure

```
src
│
├── core
│
├── world
│   ├── Road.js
│   ├── LaneMarkings.js
│   ├── Trees.js
│   ├── Buildings.js
│   └── World.js
│
├── vehicle
│   ├── VehiclePhysics.js
│   ├── VehicleController.js
│   └── VehicleState.js
│
├── mediapipe
│   ├── HandTracker.js
│   └── SteeringCalculator.js
│
├── input
│   └── InputManager.js
│
├── cockpit
│
└── Game.js
```

---

# Vehicle Physics

The vehicle uses a simplified Bicycle Model.

Implemented:

- Steering angle interpolation
- Heading update
- Position update
- Progressive throttle
- Automatic cruise control
- Speed limits
- High-speed steering reduction
- Rolling resistance
- Handbrake physics

---

# Camera

Current camera system:

- Third-person follow camera
- Smooth camera tracking
- Dynamic vehicle following

Future:

- Cockpit camera
- Camera shake
- Free camera

---

# HUD

Current HUD displays:

- Countdown
- Race timer
- Pause state
- Finish state

Future:

- Speedometer
- Gear indicator
- FPS counter
- Score
- Penalties

---

# Controls

## Keyboard

Temporary keyboard controls remain available.

| Key | Action |
|------|--------|
| W | Accelerate |
| S | Brake |
| A | Left |
| D | Right |
| Space | Handbrake |

---

## Gesture Controls

| Gesture | Action |
|----------|--------|
| 👍 | Start / Resume |
| ✋ | Pause |
| 👎 | Finish |

---

# Current Architecture

```
Camera
      ▲
      │
Game
      │
      ▼
Vehicle Controller
      │
      ▼
Vehicle Physics
      │
      ▼
Vehicle State

Input Manager
      ▲
      │
MediaPipe
```

---

# Current Gameplay

✔ Gesture-controlled driving

✔ Automatic cruise control

✔ Steering using virtual wheel

✔ Race start

✔ Pause

✔ Resume

✔ Finish

✔ Countdown

✔ Follow camera

✔ Infinite road

---

# Planned Features

## Road System

- Road boundaries
- Lane detection
- Off-road slowdown
- Grass friction
- Return-to-road warning

---

## Traffic

- AI vehicles
- Random traffic
- Overtaking
- Vehicle spawning
- Vehicle despawning
- Speed variations

---

## Collision System

- Vehicle collisions
- Obstacle collisions
- Speed penalties
- Crash animations
- Camera shake

---

## Road Objects

- Traffic cones
- Barriers
- Lamp posts
- Traffic signs
- Bus stops

---

## Traffic Rules

- Traffic lights
- Zebra crossings
- Stop signs
- Speed limits

---

## Pedestrians

- Walking AI
- Crosswalks
- Collision penalties

---

## Weather

- Rain
- Fog
- Night mode
- Dynamic lighting

---

## UI

- Speedometer
- Mini map
- Gear indicator
- Timer
- Best lap
- Score
- Collision counter

---

# Performance Goals

- 60 FPS
- 100+ AI vehicles
- Smooth gesture tracking
- Low input latency

---

# Future Improvements

- Multiple maps
- Multiplayer
- Leaderboards
- Replay system
- Mobile support
- VR support

---

# Installation

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Run development server

```bash
npm run dev
```

Build

```bash
npm run build
```

---

# Dependencies

- Three.js
- MediaPipe Tasks Vision
- Vite

---

# Roadmap

## Phase 1 ✅

- Project setup
- Three.js environment
- Vehicle physics
- Gesture recognition
- Race state machine
- Follow camera
- HUD

---

## Phase 2 🚧

- Lane boundaries
- Off-road detection
- Grass slowdown

---

## Phase 3

- AI traffic
- Collision system
- Traffic manager

---

## Phase 4

- Roadside objects
- Signals
- Pedestrians

---

## Phase 5

- Weather
- Scoring
- Sound effects
- Polish

---

# Authors

Developed as a Final Year Project demonstrating:

- Computer Vision
- Human-Computer Interaction
- 3D Graphics
- Gesture Recognition
- Real-Time Vehicle Simulation
- Game Physics
- Web Technologies

---