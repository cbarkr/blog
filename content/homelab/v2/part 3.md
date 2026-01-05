---
title: "part 3: playbook"
tags:
  - blog
  - homelab
date: 2026-01-04
---
This post serves as an informal playbook to deploy a new machine in my homelab. 
## 1. OS
1. Download a Debian [live install](https://www.debian.org/CD/live/) image (as I remember the traditional installer being a pain last time) on another machine
2. Create a live disk (e.g. using Ubuntu's *Startup Disk Creator*)
3. Inserted the live disk into the new machine and followed the installation prompts
## 2. System Configurations (Static IP Address)
1. Disable IPv6
2. Disable DHCP
3. Set a static IP and gateway

```bash
nmcli con mod <connection-name> ipv6.method "disabled" # disable IPv6
nmcli con mod <connection-name> ipv4.method "manual" # disable DHCP
nmcli con mod <connection-name> ipv4.address <static-ip-address> # set static IP
nmcli con mod <connection-name> ipv4.gateway <gateway-ip-address> # set gateway IP
nmcli con up <connection-name> # restart connection with new changes
```
## 3. System Services
### 3.1. SSH Server
1. Install a SSH server (to access the machine remotely)

```bash
sudo apt install openssh-server
```
### 3.2. Fail2Ban
1. Install [Fail2Ban](https://github.com/fail2ban/fail2ban) (to rate-limit access attempts via SSH)

```bash
sudo apt install fail2ban
```
### 3.3. Cockpit
1. Install [Cockpit](https://cockpit-project.org/) and friends ([Podman](https://podman.io/), storage, and network extensions)

```bash
sudo apt install cockpit cockpit-storaged cockpit-networkmanager cockpit-podman
```
### 3.4. Podman Compose
1. Install [Podman Compose](https://github.com/containers/podman-compose)

```bash
sudo apt install podman-compose
```
### 3.5. `iptables-persistent`
1. Install `iptables-persistent` (to persist `iptables` rules after system restarts)

```bash
sudo apt install iptables-persistent
```

---

| Previous                      | Next                          |
| ----------------------------- | ----------------------------- |
| [[homelab/v2/part 2\|part 2]] | [[homelab/v2/part 4\|part 4]] |
