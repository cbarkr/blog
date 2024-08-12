---
title: "part 2: entering the cockpit"
tags:
  - blog
date: 2024-08-12
---
## Pre-flight Check
Before diving in the deep end (and subsequently drowning), I decided I first ought to formulate a game plan:
1. Goals
2. Requirements
### 1. Goals
As I mentioned in [[part 0]], I want to use the homelab for learning, but learn what exactly? That's still an open question for myself -- I find that the more I learn, the less I know (and thus the more there is to learn) -- so I expect new topics to come and go. To start, I want to gain a practical understanding of the theory I learned in networking and security courses; such as firewalls, IDSs, VPNs, and cryptography. 

In [[part 0]], I also mentioned a number of services that I want to self-host. Naturally, my goal is to successfully self-host those services and more.
### 2. Requirements
1. All services must be run as containers
2. Root access must be minimal
3. [[foss|Free and open-source software]] must be used wherever possible
## Containers
Containers are great for a number of reasons: they're lightweight, isolatable, consistent, and portable. 

I was introduced to containers in one of my previous positions, in which I used Docker and the Docker SDK on a daily basis. Docker, however, has a problem at its roots; actually, the problem is that it relies on root. The Docker daemon and its reliance on root privileges made things difficult at times. And if possible, I'd rather avoid the headache. 

Although Docker popularized containers, it isn't the only option on the market. [Podman](https://podman.io/), for example, is a daemonless container engine that runs rootless containers. By default, Podman achieves better security than Docker does after significant configuration. And it appears to do so without the headache!
## Cockpit
In searching for administrative tools that would make my life easier, I discovered [Cockpit](https://cockpit-project.org/). It checks all the boxes for me: it's FOSS, lightweight, extendable, comprehensive, and easy to use. Most notably, Cockpit offers Podman integration: this makes it easy to spin up Podman containers directly from the Cockpit dashboard. 
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

> [!note] Note
> Contrary to many tutorials that suggest that you need to first start cockpit using `systemctl start --now cockpit`, I found that this is unnecessary

Cockpit will start on demand when a browser accesses `localhost:9090` (or whichever port it is configured to use). This should produce the following login page:

![[homelab_cockpit_login.png]]
### Use
Once Cockpit is configured and installed, the dashboard can be accessed by logging in using the system's normal user login. Once logged in, the dashboard greets the user:

![[homelab_cockpit_dashboard.png]]
With that, the server should be ready to do some serving!