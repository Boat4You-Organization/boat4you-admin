# boat4you Admin — Production Deployment Guide

This document describes how to deploy the **boat4you-admin** frontend application to the production server.

---

## Infrastructure Overview

The application is hosted across four virtual machines. The frontend (boat4you-admin) is deployed on **VM1**, which runs **nginx** as a reverse proxy.

| Component | Location |
| --------- | -------- |
| Frontend (boat4you-admin) | VM1 |
| Web root | `/var/www/admin.boat4you.com/html` |
| nginx config | `/etc/nginx/conf.d/boat4you.conf` |

---

## Prerequisites

The following tools must be installed on the machine used to build the application:

- **Node.js 24 LTS**
- **Yarn**

---

## Deployment Steps

### 1. Configure Environment Variables

In the root of the project, create a `.env` file and populate it with the production environment variable values. The required variables are:

```
VITE_BOAT_API_URL=
VITE_BASE_URL=
VITE_PUBLIC_BASE_URL=
```

> The actual values are provided separately. Do not commit this file to version control.

### 2. Install Dependencies

```bash
yarn
```

### 3. Build the Application

```bash
yarn build
```

This will produce a `dist/` folder in the project root containing the compiled static assets.

### 4. Copy Build Artifacts to VM1

Transfer the contents of the `dist/` folder to VM1 at the following path:

```
/var/www/admin.boat4you.com/html
```

> **Important:** Copy the **contents** of the `dist/` folder, not the folder itself.

### 5. Restart nginx

Once the files are in place, restart nginx on VM1 to apply the deployment:

```bash
sudo systemctl restart nginx
```

---

## nginx Configuration

The nginx configuration for this application can be found on VM1 at:

```
/etc/nginx/conf.d/boat4you.conf
```

Refer to this file if you need to update server settings, SSL certificates, proxy rules, or domain configuration.
