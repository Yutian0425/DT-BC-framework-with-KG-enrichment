# DT-BC Framework with Knowledge Graph Enrichment for Building O&M

## Overview
This repository provides a reproducible implementation of a **Digital Twin (DT) framework enhanced with Blockchain (BC) and Knowledge Graph (KG)** for building operation and maintenance (O&M).

The framework integrates:
- IoT-based sensing (real-time data)
- Semantic enrichment using BOT, BRICK, and SAREF
- Blockchain-based device authentication and event governance

The goal is to demonstrate how **semantic digital twins and blockchain can be combined** to improve:
- Data interoperability
- Device trust
- Traceability in building O&M

---

## Architecture

The system is organised into five layers:

1. Data Acquisition (IoT devices)
2. Data Transmission (MQTT pipeline)
3. Semantic Layer (Knowledge Graph)
4. Blockchain Layer (Device registry + event logging)
5. Application Layer (Dashboard and automation)

📌 See architecture diagram in the paper (Fig. 3)

---

## Key Features

- ✅ **Device Authentication (Blockchain-based)**
  - Only authorised devices can enter the DT workflow

- ✅ **Semantic Enrichment**
  - Sensor data linked to room context and measured properties

- ✅ **Lightweight Blockchain Integration**
  - Used for governance (NOT storing all sensor data)

- ✅ **Full Docker Deployment**
  - Easy to reproduce and extend

---

## Quick Start (Reproducibility)

### 1. Clone repository
```bash
git clone https://github.com/Yutian0425/DT-BC-framework-with-KG-enrichment
cd DT-BC-framework-with-KG-enrichment
