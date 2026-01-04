---
title: "part 3: playbook"
tags:
  - blog
  - homelab
date: 2026-01-04
---
This write-up serves as my informal playbook to deploying a new machine with my current services.
## 1. OS
To start, I downloaded a Debian 13 [live install](https://www.debian.org/CD/live/) image (as I remember the traditional installer being a pain last time) to my Ubuntu machine. I used the default *Startup Disk Creator* to write the image to a USB device. Finally, I inserted the USB device into the new machine and followed the installation prompts. 
## 2. System Configurations (Static IP Address)
Once the OS was installed and the machine booted into it, I disabled DHCP so the machine would maintain a static IP address, thus being reachable from a predictable address:

```bash
nmcli con mod <connection-name> ipv6.method "disabled" # disable IPv6
nmcli con mod <connection-name> ipv4.method "manual" # disable DHCP
nmcli con mod <connection-name> ipv4.address <static-ip-address> # set static IP
nmcli con mod <connection-name> ipv4.gateway <gateway-ip-address> # set gateway IP
nmcli con up <connection-name> # restart connection with new changes
```
## 3. System Services
### 3.1. SSH Server
Next, I installed an SSH server so I can remotely connect from other devices on the network:

```bash
sudo apt install openssh-server
```

After the SSH server was installed, I could log out of the machine and perform all remaining configuration and deployment remotely.
### 3.2. Fail2Ban
[Fail2Ban](https://github.com/fail2ban/fail2ban) provides some peace of mind by rate-limiting access attempts via SSH. It can be installed as simple as:

```bash
sudo apt install fail2ban
```
### 3.3. Cockpit
Cockpit and some of its helpful extensions can be installed as follows:

```bash
sudo apt install cockpit cockpit-storaged cockpit-networkmanager cockpit-podman
```
### 3.4. Podman Compose
User services are to be deployed using [podman-compose](https://github.com/containers/podman-compose), so it's a good idea to install it first:

```bash
sudo apt install podman-compose
```
### 3.5. `iptables-persistent`
`iptables` rules will be used to route requests from privileged ports to Podman containers bound to unprivileged ports. For example, AdGuard Home will handle DNS (port `53`) but will be bound to port `5300` on the host, so `iptables` rules are required to proxy `53` -> `5300`.

`iptables-persistent` ensures that our `iptables` rules are persisted after system restarts. Install it like so:

```bash
sudo apt install iptables-persistent
```
### 4. System Configurations
#### 4.1. `iptables` Rules
As described in [[#3.5. `iptables-persistent`]], some configuration is in order to allow our unprivileged services to service privileged ports. AdGuard Home and Caddy are the only relevant services, and they require:

- `53` (UDP and TCP)
- `80` (TCP)
- `443` (UDP and TCP)

Install the following configuration at `/etc/iptables/rules.v4`:

```
*nat
:PREROUTING ACCEPT [19329:1473630]
:INPUT ACCEPT [61154:4345582]
:OUTPUT ACCEPT [103775:6235567]
:POSTROUTING ACCEPT [103775:6235567]
-A PREROUTING -p udp -m udp --dport 53 -j REDIRECT --to-ports 5300
-A PREROUTING -p tcp -m tcp --dport 53 -j REDIRECT --to-ports 5300
-A PREROUTING -p tcp -m tcp --dport 80 -j REDIRECT --to-ports 8000
-A PREROUTING -p tcp -m tcp --dport 443 -j REDIRECT --to-ports 4443
-A PREROUTING -p udp -m udp --dport 443 -j REDIRECT --to-ports 4443
COMMIT
```
### 4.2. Cockpit
As Cockpit should be accessible from a custom domain behind a reverse proxy, it must be configured as such.

Install the following configuration at `/etc/cockpit/cockpit.conf`:
```conf
[WebService]
Origins = https://cockpit.lab
```
## 5. User Services
All user services are defined at https://github.com/cbarkr/homelab/tree/main/srv. Each service will contain at least:

- `compose.yml`: The [Compose file](https://docs.docker.com/reference/compose-file/) which defines each of the microservices
- `.env`: Environment variables to configure the service
- `README.md`: Documentation for the service
### 5.1. Caddy
To serve all of my services from local `*.lab` domains with HTTPS, Caddy will be doing some of the heavy lifting.
#### `.env`
```
DATA_DIR=<...>
CONF_DIR=<...>
```
#### `conf/Caddyfile`
```
# `host.containers.internal` resolves to host's IP
# See https://blog.podman.io/2024/10/podman-5-3-changes-for-improved-networking-experience-with-pasta/

adguard.lab {
	reverse_proxy host.containers.internal:8080
	tls internal
}
 
seafile.lab {
	reverse_proxy host.containers.internal:8081
	tls internal
}

immich.lab {
	reverse_proxy host.containers.internal:8082
	tls internal
}

cockpit.lab {
	reverse_proxy host.containers.internal:9090
	tls internal
}
```
#### `compose.yml`
```yml
name: caddy

services:
  caddy:
    container_name: caddy_server
    image: docker.io/caddy:2.11
    ports:
      - '8000:80/tcp'
      - '4443:443/udp'
      - '4443:443/tcp'
    volumes:
      - ${PWD}/conf:/etc/caddy
      - ${DATA_DIR}:/data
      - ${CONF_DIR}:/config
    restart: always
```
#### Deploy
```bash
podman compose up -d
```
### 5.2. AdGuard Home
Next, AdGuard Home will be used as a DNS server and will perform DNS rewrites so any request to a `*.lab` domain will be proxied by Caddy.
#### `.env`
```
WORK_DIR=<...>
CONF_DIR=<...>
```
#### `compose.yml`
```yml
name: adguardhome

services:
  server:
    container_name: adguardhome_server
    image: docker.io/adguard/adguardhome:v0.107.71
    volumes:
      - ${WORK_DIR}:/opt/adguardhome/work
      - ${CONF_DIR}:/opt/adguardhome/conf
    ports:
      - '5300:53/udp'
      - '5300:53/tcp'
      - '8080:80/tcp'
    restart: always
```
#### Deploy
```bash
podman compose up -d
```
#### Configure
Navigate to `https://adguard.lab`, locate "DNS rewrites" and add the following entry:

| Domain  | Answer                |
| ------- | --------------------- |
| `*.lab` | `<static-ip-address>` |
### 5.3. Seafile
#### `.env`
```
DB_LOCATION=<...>
DATA_LOCATION=<...>
DB_ROOT_PASSWORD=<...>
SEAFILE_ADMIN_EMAIL=<...>
SEAFILE_ADMIN_PASSWORD=<...>
SEAFILE_SERVER_HOSTNAME=<...>
```
#### `compose.yml`
```yml
name: seafile

services:
  database:
    container_name: seafile_mariadb
    image: docker.io/library/mariadb:10.6
    volumes: ${DB_LOCATION}:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_LOG_CONSOLE: true
    restart: always

  cache:
    container_name: seafile_memcached
    image: docker.io/library/memcached:1.6.32
    restart: always

  seafile_server:
    container_name: seafile_server
    image: docker.io/seafileltd/seafile-mc:11.0.12
    volumes: ${DATA_LOCATION}:/shared
    environment:
      DB_HOST: database
      DB_ROOT_PASSWD: ${DB_ROOT_PASSWORD}
      SEAFILE_ADMIN_EMAIL: ${SEAFILE_ADMIN_EMAIL}
      SEAFILE_ADMIN_PASSWORD: ${SEAFILE_ADMIN_PASSWORD}
      SEAFILE_SERVER_HOSTNAME: ${SEAFILE_SERVER_HOSTNAME}
      SEAFILE_SERVER_LETSENCRYPT: false
      FORCE_HTTPS_IN_CONF: true
    ports: '8081:80'
    depends_on:
      - database
      - cache
    restart: always
```
#### Deploy
```bash
podman compose up -d
```
#### Configure
Get a shell in the container:

```bash
podman exec -it <container-id> /bin/bash
```

Open the Seafile settings:

```bash
nano seafile/data/seafile/conf/seahub_settings.py
```

Add the domain to the trusted origins:

```diff
- CSRF_TRUSTED_ORIGINS = []
+ CSRF_TRUSTED_ORIGINS = ["https://seafile.lab"]
```

Then restart the pod:

```bash
podman compose restart
```

---

| Previous                      | Next |
| ----------------------------- | ---- |
| [[homelab/v2/part 2\|part 2]] | null |