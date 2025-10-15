Net Manager

This project aims to build a cloud-hosted, multi-tenant Network Monitoring as a Service (NMSaaS) platform, leveraging the LibreNMS engine to provide network monitoring with a user-friendly interface for small to medium-sized organizations. The platform will run on a single cloud VM and uses Docker for containerization, ensuring a consistent, reproducible, and cost-effective environment.

Project Overview

Frontend: React.js, providing a dashboard interface for users to manage and monitor their network devices.

Backend: Express.js (Node.js), handling user authentication, tenant management, and acting as an API gateway to the LibreNMS API.

Database: PostgreSQL running in a Docker container to store application-specific data such as users, tenants, and subscription info.

Monitoring Engine: LibreNMS, providing SNMP polling for network devices and exposing data via REST APIs.

Automation & Alerting Engine: n8n (Community Edition), to process alerts and notifications.

Current Status - Phase 1: Core Backend & Database

In this phase, we've focused on setting up the core backend and database for user registration, login, and tenant management.

Key Features Implemented in Phase 1:

Backend: Express.js API for handling user authentication and tenant registration.

Database: PostgreSQL database is set up to store tenant and user information. The saas_db is created to ensure data isolation between tenants.

User Authentication: JWT-based authentication for managing sessions and ensuring secure access to tenant-specific data.

Next Steps (Phase 2)

Develop the React.js frontend for user login/registration.

Set up the basic dashboard UI for visualizing device data and managing user alerts.