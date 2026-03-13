# Resonance Logs CN — English Fork

> **This is an unofficial English-language fork of [resonance-logs-cn](https://github.com/fudiyangjin/resonance-logs-cn).**
> The purpose of this fork is to translate the UI, labels, boss names, class names, and skill names from Chinese into English so that non-Chinese-speaking players of **Blue Protocol: Star Resonance** can use the application comfortably.
>
> All core logic, architecture, and original feature work belongs to the upstream authors. This fork only applies localisation patches on top.

---

## What is Resonance Logs CN?

[Blue Protocol: Star Resonance](https://www.starresonance.com/) is an online action RPG. Resonance Logs CN is a desktop companion application that provides:

- **Real-time DPS tracking** — live damage-per-second, active time, and encounter history
- **Buff monitoring** — skill cooldown tracking, buff aliases, and category shortcuts (food / alchemy)
- **Module optimisation** — packet-based module data with smart best-in-slot calculation (optional GPU acceleration via CUDA / OpenCL)
- **Custom panels** — counter and buff display in progress-bar form
- **Game overlay** — transparent always-on-top window with hotkey toggle and masking support
- **Auto-update** — in-app OTA updates via GitHub Releases

---

## English Translation Status

| Area | Status |
|---|---|
| Boss names in history list & detail view | ✅ Translated |
| Class & spec names | ✅ Translated |
| Sub-skill / recount group names | ✅ Translated |
| UI chrome (tabs, buttons, labels) | ✅ Already in English upstream |
| Scene / zone names | ⏳ Planned |
| Module names | ⏳ Planned |

---

## Tech Stack

- **Backend:** Rust + [Tauri 2](https://tauri.app/)
- **Frontend:** SvelteKit 5 + Svelte + TypeScript + Tailwind CSS
- **Packet capture:** WinDivert / Npcap (Windows network packet capture)

---

## System Requirements

- **Platform:** Windows (requires administrator privileges for WinDivert)
- **Node.js:** required for frontend build
- **Rust:** required for Tauri build

---

## Getting Started

### Install dependencies

```bash
npm install
```

### Development mode

```bash
npm run tauri dev
```

### Production build

```bash
npm run tauri build
```

Build output is located at `src-tauri/target/release/bundle/` as an NSIS installer.

### Module optimisation build notes

The module optimisation feature depends on a C++ extension and optionally uses GPU acceleration (CUDA / OpenCL). Before building, refer to the environment requirements from [StarResonanceAutoMod](https://github.com/fudiyangjin/StarResonanceAutoMod):

**Base requirements (CPU-only build):**
- Visual Studio Build Tools 2019/2022 or Visual Studio (MSVC compiler)
- Windows SDK

**GPU build additional requirements:**
- **CUDA Toolkit 12.9** (NVIDIA RTX 20XX+; 12.9+ adds 50XX support)
- Or **OpenCL** (NVIDIA / AMD / Intel — usually bundled with GPU drivers or CUDA)

The build script auto-detects CUDA/OpenCL. If neither is found, a CPU-only build is produced. If the C++ source directory `src-tauri/src/module_optimizer/cpp/` is absent, the module optimiser is skipped entirely — all other features still work.

---

## Documentation

- [`doc/`](./doc/) — Feature guides and [FAQ](./doc/faq.md)

---

## Download

- [Releases](https://github.com/Mythicc123/resonance-logs-cn/releases) — pre-built installers for this English fork

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)

---

## License

[AGPL-3.0-only](LICENSE)

---

## Credits & Upstream

- [resonance-logs](https://github.com/resonance-logs/resonance-logs) — original upstream project
- [resonance-logs-cn](https://github.com/fudiyangjin/resonance-logs-cn) — Chinese fork this repo is based on
- [StarResonanceDamageCounter](https://github.com/dmlgzs/StarResonanceDamageCounter) — damage tracking reference implementation
- [StarResonanceAutoMod](https://github.com/fudiyangjin/StarResonanceAutoMod) — module optimisation algorithm and build reference
