---
title: "part 2: cockpit"
tags:
  - blog
  - homelab
date: 2024-08-12
---
## Preamble
In search of administrative tools that would make my life easier, I discovered [Cockpit](https://cockpit-project.org/). It checks all the boxes for me: it's FOSS, lightweight, extendable, comprehensive, and easy to use. Extensibility is key; Cockpit provides a number of [applications](https://cockpit-project.org/applications) to integrate management tools for various things, such as storage, networking, VMs, Podman containers, etc. One of the most helpful for me is the Podman app, making it easy to spin up pods and containers directly from the Cockpit GUI. 
## Installation
Since I'm using Debian, I followed the installation instructions [here](https://cockpit-project.org/running.html#debian). At the time of writing, the installation is as follows:

```bash
. /etc/os-release
echo "deb http://deb.debian.org/debian ${VERSION_CODENAME}-backports main" > \
    /etc/apt/sources.list.d/backports.list
apt update
apt install -t ${VERSION_CODENAME}-backports cockpit
```

> [!note] Note
> I had issues installing the `...-backports` as described above, so I omitted them (i.e. `apt install`ed `cockpit`)

I also installed some extensions that I thought might come in handy (including Podman): 

```bash
apt install cockpit-storaged cockpit-networkmanager cockpit-podman
```
## Entering the Cockpit

> [!info] Info
> Contrary to many tutorials' suggestions that Cockpit must be started using `systemctl start --now cockpit`, Cockpit will start on demand (as below)

Cockpit will start on demand when a browser accesses `localhost:9090` (or whichever port it is configured to use). This should produce the following login page:

![[cockpit_login.png]]
Cockpit uses the system's normal user login. After logging in, the user is greeted with the dashboard:

![[cockpit_dashboard.png]]
With that, the server should be ready to do some serving!

---

| Previous                      | Next       |
| ----------------------------- | ---------- |
| [[homelab/v1/part 1\|part 1]] | [[part 3]] |
