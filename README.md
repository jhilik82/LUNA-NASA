# 🌕 LUNA — Beyond the Lifeline

### A Space Exploration, Mission Simulation & Survival Experience

**LUNA — Beyond the Lifeline** is an interactive space exploration game that puts players in the middle of ambitious Moon and Mars missions. Combining cinematic storytelling, spacecraft flight and landing simulations, outpost operations, habitat management, and science-driven decision-making, LUNA delivers an immersive experience of humanity's journey beyond Earth.

Every decision matters. Manage limited resources, maintain your crew's survival, establish sustainable habitats, and navigate the challenges of operating millions of kilometers away from home.

**Your mission is not simply to reach another world. It's to survive there.**

---

## 🚀 Experience LUNA

LUNA combines multiple gameplay systems into one interconnected mission experience.

- 🌍 **Explore Beyond Earth:** Choose between Moon and Mars missions, each with its own mission progression.
- 🛰️ **Experience the Journey:** Progress through story-driven mission phases, from boarding and launch to interplanetary travel and landing.
- 🏕️ **Build and Manage Outposts:** Operate habitats, monitor environmental conditions, and manage essential resources.
- 🌱 **Establish Sustainable Agriculture:** Grow crops inside a visible greenhouse, manage growth cycles, and plan delayed harvests.
- 👨‍🚀 **Work Alongside Your Crew:** Interact with three animated coworker units integrated into the game environment.
- 📡 **Communicate with Earth:** Experience realistic communication delays and time-dependent responses through the Ask Earth system.
- 🧭 **Make Informed Decisions:** Review mission guidance, evaluate recommended actions, and confirm decisions before committing them.

---

## ✨ What's New in Version 1.3.1?

This release merges the core gameplay experience, mission-guidance systems, local workspace foundation, and supporting backend infrastructure.

| Feature | Description |
|---|---|
| Story-driven missions | A cinematic mission flow featuring Moon and Mars destinations. |
| Guided outpost operations | A seven-stage mission progression system. |
| LUNA Academy | A separate educational course containing 10 lessons. |
| Decision confirmation | Review and confirm workflow before actions are committed. |
| Greenhouse simulation | Visible crop growth, configurable cycle timing, and delayed harvesting. |
| Animated crew | Three animated coworker units integrated into the world. |
| Earth communications | Time-based communication delays and Ask Earth responses. |
| Mission guidance | Action-aware recommendations, objectives, and checkpoints. |
| Audio experience | Procedural ambient music with independent music and sound-effects controls. |
| Local persistence | JSON-based save system with backup support. |
| Workspace dashboard | Monitor gameplay progress through a local dashboard. |
| NASA data tooling | Optional data refresh, validation, and Supabase publishing workflows. |

**Design philosophy:** LUNA keeps mission guidance entirely on-screen. There is no spoken narration, allowing players to experience the environment without voice interruptions.

---

## 🎮 Gameplay Overview

### 1. Mission Preparation & Launch

Begin with a story-driven introduction and select your destination.

Experience the mission progression through:

- Story introduction
- Destination selection
- Spacecraft boarding
- Launch sequence
- Cruise and transfer
- Atmospheric entry and landing

### 2. Mission Operations

Once you reach your destination, the focus shifts from exploration to survival and mission management.

Monitor and manage:

- Power availability
- Oxygen levels
- Crew conditions
- Habitat operations
- Scientific objectives
- Mission progression

Your decisions influence the mission's operational state.

### 3. Outpost & Greenhouse Management

Establish sustainable operations beyond Earth.

The greenhouse system introduces:

- Visible crop cultivation
- Crop growth progression
- Configurable growth-cycle timing
- Delayed harvesting mechanics
- Agricultural planning

### 4. Mission Guidance & Learning

LUNA incorporates an interactive guidance system designed to help players understand their mission responsibilities.

Two distinct learning experiences are included:

**Guided Outpost Mission**
- Seven mission stages.
- Action-aware guidance.
- Objectives and checkpoints.
- Review-and-confirm decision workflow.

**LUNA Academy**
- Ten educational lessons.
- Separate from the main mission progression.
- Designed to complement the gameplay experience.

---

## 🪐 Destinations

LUNA features two mission destinations:

### 🌕 Moon Mission
Experience the challenges of establishing and maintaining a lunar outpost.

### 🔴 Mars Mission
Explore the operational challenges of establishing a human presence on Mars.

Both destinations use the existing LUNA world layout and mission framework.

---

## 🛠️ Technology & Architecture

LUNA is built around a browser-based game architecture with a lightweight local backend.

The project preserves its Local Workspace foundation while integrating the updated gameplay systems and supporting tools.

### Core Components

| Component | Responsibility |
|---|---|
| Game Client | Rendering, gameplay, interactions, and mission progression. |
| Simulation Systems | Resource management, habitat operations, and mission state. |
| Guidance Layer | Objectives, checkpoints, recommendations, and decision workflows. |
| Local Backend | Runtime state, progress persistence, and local API services. |
| Workspace Dashboard | Displays saved gameplay progress. |
| Data Pipeline | Validates and prepares optional NASA-informed data updates. |
| Cloud Publishing | Optional Supabase integration for prepared data packs. |

### Data & Persistence

The local backend uses atomic JSON file operations to store runtime state and gameplay progress.

Key capabilities include:

- Local save and progress persistence.
- Backup files and recovery support.
- Versioned data-pack validation.
- Local progress API.
- Optional cloud publishing pipeline.

**Normal gameplay does not require a separate online service.**

---

## 📁 Project Structure

```text
LUNA-NASA/
│
├── backend/
│   ├── Local API
│   ├── Save files
│   └── Optional cloud publishing
│
├── dist/
│   ├── Editable source modules
│   └── Generated game bundles
│
├── docs/
│   └── Supporting documentation
│
├── tests/
│   └── Automated test coverage
│
├── tools/
│   ├── Build utilities
│   ├── Data refresh tools
│   └── Export helpers
│
├── README.md
├── README-START-HERE.md
├── HOW_TO_PLAY.md
├── CHANGES.md
├── FEATURE_ORIGINS.md
├── NASA_AND_MODELS.md
├── QA_REPORT.md
├── package.json
└── .env.example
```

> **Important:** The editable source files live in `dist/`. Generated files such as `dist/game.js` and `dist/luna-playable.html` are produced by the build process.

---

## 💻 Getting Started

### Prerequisites

Before running LUNA, make sure your environment meets the following requirements:

| Requirement | Version / Specification |
|---|---|
| Node.js | 22 or newer |
| npm | Included with Node.js |
| Browser | Modern WebGL 2-compatible browser |
| Python | Optional; required for certain data and testing workflows |
| Supabase | Optional; required only for cloud publishing |

### 1. Clone the Repository

```bash
git clone <repository-url>
cd LUNA-NASA
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Game

```bash
npm start
```

### 4. Open LUNA

Navigate to:

```text
http://localhost:3000
```

Begin your mission and explore beyond Earth!

---

## ⚙️ Available Commands

| Command | Description |
|---|---|
| `npm start` | Starts the game server and local API. |
| `npm run dev` | Rebuilds the client when source files change. |
| `npm test` | Runs the automated test suite. |
| `npm run check` | Runs repository validation checks. |
| `npm run build` | Builds distributable client bundles. |
| `npm run data:test` | Runs offline data validation tests. |
| `npm run data:check` | Checks NASA publication headers. |
| `npm run data:refresh` | Stages and publishes a refreshed data pack. |
| `npm run cloud:publish` | Uploads prepared data to Supabase. |

---

## 🧪 Testing & Validation

LUNA includes automated tests and repository validation tools to help maintain the reliability of its gameplay and supporting infrastructure.

Current validation coverage includes:

- Automated test suite.
- Repository consistency checks.
- Offline data validation.
- NASA publication-header checks.
- Data-pack validation.
- Build verification.

### Known Verification Limitations

Some aspects still require verification in a real GPU-enabled browser environment.

In particular:

- Final visual rendering and polish.
- WebGL 2 compatibility.
- Browser-specific gameplay behavior.
- Performance under different hardware configurations.

For detailed validation results, known limitations, and outstanding checks, see **[QA_REPORT.md](QA_REPORT.md)**.

---

## 🌌 NASA Data & Scientific Context

LUNA incorporates NASA-informed data workflows and supporting scientific documentation.

The project includes optional tools for refreshing and validating data packs, alongside documentation describing the sources, assumptions, and limitations of the underlying models.

For transparency, the project distinguishes between scientific context, simulation assumptions, and actual gameplay mechanics.

Explore:

- [NASA_AND_MODELS.md](NASA_AND_MODELS.md) — Data sources, scientific assumptions, and model limitations.
- [FEATURE_ORIGINS.md](FEATURE_ORIGINS.md) — Preserved and adapted project features.

> LUNA is an educational and interactive simulation. Its gameplay systems and scientific assumptions should not be interpreted as fully validated engineering models for real-world space missions.

---

## 📚 Documentation

Looking for more information?

| Document | Description |
|---|---|
| [README-START-HERE.md](README-START-HERE.md) | Windows and VS Code installation guide. |
| [HOW_TO_PLAY.md](HOW_TO_PLAY.md) | Gameplay walkthrough and controls. |
| [CHANGES.md](CHANGES.md) | Detailed changelog and file inventory. |
| [FEATURE_ORIGINS.md](FEATURE_ORIGINS.md) | Preserved and adapted features. |
| [NASA_AND_MODELS.md](NASA_AND_MODELS.md) | NASA sources and scientific assumptions. |
| [QA_REPORT.md](QA_REPORT.md) | Testing coverage and known limitations. |
| [backend/README.md](backend/README.md) | Backend architecture, saves, recovery, and cloud publishing. |

---

## 🔊 Audio & Accessibility

LUNA's audio experience is designed to complement the gameplay without interrupting mission guidance.

- Quiet procedural ambient music.
- Independent music and sound-effects controls.
- No spoken narration.
- All mission instructions and guidance are presented as on-screen text.

---

## ☁️ Optional Cloud Integration

LUNA supports an optional Supabase publishing workflow for prepared data packs.

This functionality is separate from normal gameplay.

To use cloud publishing:

1. Configure the required environment variables using `.env.example`.
2. Set up a Supabase project.
3. Provide the necessary project credentials.
4. Prepare and validate the data pack.
5. Execute:

```bash
npm run cloud:publish
```

Refer to [backend/README.md](backend/README.md) for the complete configuration and publishing instructions.

---

## 📝 Important Notes

- Normal gameplay runs locally through the included game server and backend.
- No separate game engine or external online service is required for standard gameplay.
- Source modules are maintained in `dist/`.
- Generated bundles are produced through the build process.
- NASA data refresh and Supabase publishing are optional workflows.
- Python is only required for selected data-related and testing commands.
- Final visual verification should be performed in a supported GPU-enabled browser.

---

## 🌍 Beyond the Lifeline

Humanity's future may extend beyond Earth, but survival will depend on the decisions we make along the way.

Manage your resources. Protect your crew. Build your outpost. Learn from every mission.

**The next frontier is waiting.**

---

### Quick Launch

```bash
npm install
npm start
```

Open **http://localhost:3000** and begin your journey.

**Welcome to LUNA.**
