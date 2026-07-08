---
title: "part 7: auto-starting containers as systemd services"
tags:
  - blog
  - homelab
date: 2026-07-07
---
Power outages are frustrating. Not only did the coffee maker not make coffee on time, its clock's incessant flashing reminds me of that fact every second. Worse yet, I know I then have to SSH into the homelab and re-run `podman compose up` for every single service.

This has happened at least one too many times. So this morning, I decided enough was enough, and finally got around to automating the starting of these services on boot.
## Background
systemd *units* encapsulate information about system services, listening sockets, and other objects that are relevant to the init system [^unit]. *Service* units (`.service` extension) define, well, services. These service units, stored in `~/.config/systemd/user` and managed using `systemctl` with the `--user` flag, allows systemd services to be run as a specific user - perfect for our rootless podman containers.
## Setup
> All user (systemd) services are defined in [my homelab repository](https://github.com/cbarkr/homelab/tree/main/srv)
### 1. Unit Files
For the syntax of service units, see `man systemd.unit` and `man systemd.service`, or visit the [Red Hat docs](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/using_systemd_unit_files_to_customize_and_optimize_your_system/working-with-systemd-unit-files). In short, the `[Unit]` section "carries generic information about the unit that is not dependent on the type of unit", while the `[Service]` section "carries information about the service and the process it supervises".

For each `podman compose` service (i.e. each subdirectory within the `srv/` directory), I defined service units according to the following template:

```
[Unit]
Description=<service-name> Stack
Wants=network-online.target
After=network-online.target local-fs.target

[Service]
Type=oneshot
RemainAfterExit=yes

WorkingDirectory=%h/homelab/srv/<service-dir>
ExecStart=/usr/bin/podman compose up -d
ExecStop=/usr/bin/podman compose down
ExecReload=/usr/bin/podman compose restart

[Install]
WantedBy=default.target
```

Where:
- `<service-name>`: The name of the service (e.g. "Adguard Home", "Caddy", etc.)
- `<service-dir>`: The name of the service directory (e.g. `adguardhome`, `caddy`, etc.)
- `Wants`/`After`: The units after which this unit should run after (i.e. after networking and filesystem mounts come online)
- `Type=oneshot`: The service type (i.e. execute an action without keeping active processes)
- `RemainAfterExit=yes`: The service linger behaviour (i.e. remain up after the main process exits)
- `WorkingDirectory=%h/homelab/srv/<service-dir>`: The working directory for the subsequent `Exec*` commands (i.e. the `homelab` repo in the user's home directory)
- `Exec[Start/Stop/Reload]`: The commands mapped to `systemctl [start/stop/reload]` (i.e. to the respective `podman compose [up/down/restart]` commands)
- `WantedBy=default.target`: The installation sequence (i.e. as part of the default boot sequence)

These `.service` units were stored alongside the `compose` projects themselves (i.e. within the respective `srv/` subdirectories) so they can be tracked in the repository alongside the other configurations. 
### 2. Installation Script
As the `.service` files were not stored in systemd's desired location (`~/.config/systemd/user`), I created an "install" script to symlink them and enable/start the services using `systemctl --user enable --now`. At the time of writing, this script looks something like this:

```bash
#!/usr/bin/env bash

# Fail fast, fail loud
set -euo pipefail

# Install systemd units
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL_DIR="$HOME/.config/systemd/user"
mkdir -p "$INSTALL_DIR"

ln -sf "$REPO_ROOT/srv/adguardhome/adguardhome.service" \
	"$INSTALL_DIR/adguardhome.service"
ln -sf "$REPO_ROOT/srv/caddy/caddy.service" \
	"$INSTALL_DIR/caddy.service"
ln -sf "$REPO_ROOT/srv/immich/immich.service" \
	"$INSTALL_DIR/immich.service"
ln -sf "$REPO_ROOT/srv/seafile/seafile.service" \
	"$INSTALL_DIR/seafile.service"

# Start systemd units
systemctl --user daemon-reload
systemctl --user enable --now \
	adguardhome.service \
	caddy.service \
	immich.service \
	seafile.service
```

By running the script, the user services are enabled and will be automatically started upon the next reboot.
## Summary
That's all there is to it! It's a shame it took me so long to get around to this, but I'm glad to no longer have to manually run `podman compose up` every time the power goes out. Maybe I should also get a UPS for good measure...

---

| Previous                      | Next |
| ----------------------------- | ---- |
| [[homelab/v2/part 6\|part 6]] | null |

[^unit]: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/7/html/system_administrators_guide/chap-managing_services_with_systemd
