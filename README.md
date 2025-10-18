<h1 align="center">🌐 Net Manager</h1>

<p align="center">
  <i>Cloud-hosted, containerized Network Monitoring as a Service powered by LibreNMS, Express.js, and React.</i>
</p>

---

## 🚀 Project Overview

**Multi-Tenant NMSaaS** is a cloud-hosted, multi-tenant **Network Monitoring as a Service** platform built for small to medium-sized organizations.  
It abstracts the complexity of **LibreNMS** behind a simplified SaaS interface, offering modern dashboards, automated alerting, and strong tenant isolation — all in a **single-VM containerized environment**.

---

## 🧠 Project Vision

The goal is to make enterprise-grade network monitoring **accessible**, **scalable**, and **affordable** — without requiring infrastructure expertise.  
By combining **LibreNMS**, **Express.js**, **React**, and **Docker**, we deliver a plug-and-play monitoring solution deployable anywhere.

---

## 🏗️ Core Architecture

> A containerized, single-VM approach for maximum reproducibility and simplicity.

Cloud VM (Azure)


All services communicate securely through a **private internal Docker network**.

---

## 🧩 Technology Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,nodejs,express,postgres,docker,nginx,git,linux" />
</p>

| Component | Technology | Role |
|------------|-------------|------|
| **Frontend** | React.js | User dashboard for device onboarding, monitoring, and alerts |
| **Backend** | Express.js (Node.js) | API gateway, tenant management, and authentication |
| **Database** | PostgreSQL | Dual database setup for `saas_db` and `librenms_db` |
| **Monitoring Engine** | LibreNMS | SNMP polling and REST API provider |
| **Automation Engine** | n8n | Webhook automation, alert routing, and anomaly detection |
| **Dev Tooling** | PgAdmin, Docker Compose | Schema management and environment orchestration |

---

## ⚙️ Architecture Breakdown

### 🖥️ Frontend — React.js
- Pure client-side app  
- Communicates only with the backend API (no direct LibreNMS access)  
- Features:
  - Device visualization dashboards
  - Historical graphs
  - Alerts and notifications

### 🧠 Backend — Express.js
Handles:
- 🔐 Authentication & Authorization (JWT)
- 🏢 Multi-tenant data isolation
- 🌉 Acts as a secure proxy to the LibreNMS API
- 📦 Routes and sanitizes responses for frontend consumption

### 🗄️ Database — PostgreSQL
Two logical databases:
- `saas_db` → Used by Express backend for tenants, users, and subscriptions  
- `librenms_db` → Managed entirely by LibreNMS  

Separation ensures schema independence and security.

### 📡 Monitoring — LibreNMS
- SNMP polling engine  
- REST API for metrics and device info  
- Webhooks for real-time alerts to n8n

### 🤖 Automation — n8n
- Receives webhooks from LibreNMS  
- Determines device ownership via `saas_db`  
- Routes alerts to email/Slack/Teams  
- Stretch goal: anomaly detection using LLMs

---

## 🧱 Development & Deployment Workflow

| Environment | Description | Command |
|--------------|--------------|----------|
| **Development** | Hot reload + debugging with PgAdmin | `docker-compose up` |
| **Production** | Optimized Nginx build | `docker-compose -f docker-compose.yml up` |

The stack is **identical** between dev and prod to eliminate "it worked on my machine" issues.

---

## 🗂️ Folder Structure

project-root/
│
├── backend/ # Express.js API
│ ├── src/
│ ├── package.json
│ └── Dockerfile
│
├── frontend/ # React app
│ ├── src/
│ ├── public/
│ └── Dockerfile
│
├── docker-compose.yml # Full-stack definition
├── docker-compose.override.yml
├── init.sql # Database schema (phase 2)
└── README.md


---

## 🧩 Phased Implementation Plan

| Phase | Description | Status |
|--------|--------------|---------|
| **1** | Core Backend + PostgreSQL | ✅ Completed |
| **2** | React Frontend Foundation | ✅ Completed |
| **3** | Integrate LibreNMS API | ⏳ In Progress |
| **4** | Add n8n Automation | 🔜 Planned |

---

## 📈 Current Status

✅ **Phase 1:** Express.js API with user/tenant registration & login connected to PostgreSQL  
✅ **Phase 2:** React.js frontend with login and dashboard  
🔧 **Dual environment support** via Docker Compose overrides  
🧩 **API environment control** through `REACT_APP_API_BASE_URL`

---

## 🌐 Future Enhancements

- AI-driven anomaly detection (via n8n + external LLM)
- Tenant-level usage metrics
- Self-service billing and plan management
- Grafana integration for enhanced visualizations

---

## 📸 Screenshots

<p align="center">
  <img src="https://via.placeholder.com/900x400.png?text=Dashboard+Preview" alt="Dashboard Preview" />
</p>

---

## 💡 Key Takeaways

- 💻 **Single-VM**, **multi-container** setup = cost-effective deployment  
- 🔒 **Tenant isolation** ensures data security  
- 🔁 **End-to-end workflow** from device polling → alert → user notification  
- 🚀 **Portable** and **cloud-ready** for any provider (AWS, Azure, DigitalOcean)

---

## 🤝 Contributing

Pull requests are welcome!  
For major changes, please open an issue first to discuss what you'd like to change.

---

## 📜 License

This project is licensed under the **Felipe Cruz* — feel free to use and modify.

---

<p align="center">
  Built with ❤️ using <b>React, Express, PostgreSQL, Docker & LibreNMS</b>.
</p>
