---
title: "part 2: entering the cockpit"
tags:
  - blog
date: 2024-08-12
---
## Pre-flight Check
Before diving in the deep end (and subsequently drowning), I decided I first ought to formulate a game plan:
1. What are my goals?
2. What are my requirements?
3. What are the threats?
4. How can I meet my goals and requirements while mitigating threats?
### 1. Goals
As I mentioned in [[part 0]], I want to use the homelab for learning, but learn what exactly? That's still an open question for myself -- I find that the more I learn, the less I know (and thus the more there is to learn) -- so I expect new topics to come and go. To start, I want to gain a practical understanding of the theory I learned in networking and security courses; such as firewalls, IDSs, VPNs, and cryptography. 

In part 0, I also mentioned a number of services that I want to self-host. Naturally, my goal is to successfully self-host those services and more.
### 2. Requirements
Here, I define a few self-imposed requirements:
1. All services must be run as containers
2. Root access must be minimal
3. [[foss|Free and open-source software]] must be used wherever possible
### 3. Threats
Since this is a *home*lab and is therefore confined to my home network (for now), few threats are posed. I will eventually want to access my home network while away, which will warrant more serious threat modelling. Some vectors that come to mind now are:

| Vector                | Mitigation                                                      |
| --------------------- | --------------------------------------------------------------- |
| Resource abuse        | Configure resource limits for all containers                    |
| Image vulnerabilities | Regularly update and rebuild images for latest security patches |
| Container escape      | Minimize root access, limit mounts                              |
### 4. How
#### Containers
Containers are great for a number of reasons: they're lightweight, isolatable, consistent, and portable. 

The most popular container engine is Docker. I've used Docker on and off for the past couple of years, and it's been an alright experience overall. Docker, however, has a problem at its roots; actually, the problem is that it relies on root. The Docker daemon and its reliance on root privileges made things difficult at times.

Although Docker popularized containers, it isn't the only option on the market. [Podman](https://podman.io/), for example, is a daemonless container engine that runs rootless containers. This is what I'll be using for running services on my homelab.
#### Administration
In searching for administrative tools that would make my life easier, I discovered [Cockpit](https://cockpit-project.org/). It checks all the boxes for me: it's FOSS, lightweight, extendable, comprehensive, and easy to use. Most notably, Cockpit offers Podman integration: this makes it easy to spin up Podman containers directly from the Cockpit dashboard. 
## Cockpit
### Installation
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
### Entering the Cockpit

> [!note] Note
> Contrary to many tutorials that suggest that you need to first start cockpit using `systemctl start --now cockpit`, I found that this is unnecessary

Cockpit will start on demand when a browser accesses `localhost:9090` (or whichever port it is configured to use). This should produce the following login page:

![[homelab_cockpit_login.png]]
Cockpit uses the system's normal user login. After logging in, the user is greeted with the dashboard:

![[homelab_cockpit_dashboard.png]]
With that, the server should be ready to do some serving!