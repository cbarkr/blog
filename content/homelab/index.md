---
title: homelab
tags:
  - blog
  - homelab
date: 2024-07-22
---
## What is a "homelab"? 
A homelab is (1) a collection of computing and networking hardware, and (2) a low-stakes environment for experimenting with various technologies. The hardware can be as simple as an old laptop and your ISP's modem, or as complex as enterprise-grade servers, switches, routers, etc. 
## Why do I want a homelab?
### 1. Experimentation
I learn by doing. And by doing, I mean breaking things, fixing them, breaking them again, and repeating until things eventually work. By process of enumeration, I learn what works and what doesn't. 

At home, the stakes are very low; misconfiguring my server inconveniences myself only (and maybe my family (sorry mom)). This way, I (hopefully) learn what works and what doesn't before the stakes become high.
### 2. Self-hosting
Homelabs provide the means to host services on your own terms. Sick of invasive ads and trackers? Me too! Not comfortable with letting someone else manage your data? Me neither! Who wants access to subscription-free, restriction-free services? Me!
## What am I going to do with a homelab?
1. Host an ad/tracker-blocking DNS server, such as ~~[Pi-hole](https://pi-hole.net/)~~ or [AdGuard Home](https://adguard.com/en/adguard-home/overview.html)
2. Ditch Google Drive for ~~[ownCloud](https://owncloud.com/)~~, ~~[NextCloud](https://nextcloud.com/)~~, or [Seafile](https://www.seafile.com/en/home/)
3. Backup my photos on [Immich](https://immich.app/)
4. Replace my ISP router with an [OPNsense](https://opnsense.org/) box
5. Integrate an IPS/IDS, such as [Suricata](https://suricata.io/) and [Snort](https://www.snort.org/)
6. Run a media server like [Jellyfin](https://jellyfin.org/) or [Plex](https://www.plex.tv/)
7. Break stuff, fix stuff, (hopefully) learn stuff
## How am I going to do it?
My three main (self-imposed) requirements are:
1. Services should be run as rootless (Podman) containers
2. [[foss|Free and open-source software]] should always be the first choice
3. Deploying services to a new environment should be fast and easy (using automated methods)
## Where are we at now?
The lab is currently on its second iteration. My write-ups for the [[homelab/v1/index|first iteration]], while incomplete and at times incorrect, are retained here for archiving purposes. The [[homelab/v2/index|second iteration]] runs the same services and more, while being configured in a simpler, repeatable, programmatic fashion. 