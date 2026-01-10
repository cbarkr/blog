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
3. Insert the live disk into the new machine and follow the installation prompts
## 2. System Services
## 2.1 CUPS
1. Remove CUPS (as I sure as hell don't want or need to connect this machine to a printer)

```bash
sudo systemctl stop cups
sudo systemctl disable cups
sudo apt remove --purge -y cups
sudo apt -y autoremove
```
### 2.2. SSH Server
1. Install a SSH server (to access the machine remotely)

```bash
sudo apt install -y openssh-server
```
### 2.3. Firewall
1. Install [UFW](https://help.ubuntu.com/community/UFW) (the *Uncomplicated Firewall*)

```bash
sudo apt install -y ufw
```
### 2.4. Fail2Ban
1. Install [Fail2Ban](https://github.com/fail2ban/fail2ban) (to rate-limit access attempts via SSH)

```bash
sudo apt install -y fail2ban
```
### 2.5. Cockpit
1. Install [Cockpit](https://cockpit-project.org/) and friends ([Podman](https://podman.io/), storage, and network extensions)

```bash
sudo apt install -y cockpit cockpit-storaged cockpit-networkmanager cockpit-podman
```
### 2.6. Podman Compose
1. Install [Podman Compose](https://github.com/containers/podman-compose)

```bash
sudo apt install -y podman-compose
```

## 3. System Configurations
### 3.1. Static IP Address
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
### 3.2. Firewall
1. Deny incoming
2. Allow outgoing
3. Allow SSH
4. Allow Cockpit's web interface (running on port `9090`)
5. Enable the firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 9090
sudo ufw enable
```

---

| Previous                      | Next                          |
| ----------------------------- | ----------------------------- |
| [[homelab/v2/part 2\|part 2]] | [[homelab/v2/part 4\|part 4]] |
