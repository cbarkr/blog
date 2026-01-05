---
title: "part 4: binding rootless containers to privileged ports; AdGuard Home and Caddy for local domains with HTTPS"
tags:
  - blog
  - homelab
date: 2026-01-04
---
This post discusses how to configure Caddy and AdGuard Home as rootless Podman containers using `podman compose` and `iptables`.
## Background
The beauty of rootless containers is that they are, well, rootless; they "elegantly constrain privileges by using a subuid/subgid map to enable the container to run in the user namespace but with what feels like full root privileges"[^podman]. 

What if you want to solve a rootful problem with a rootless solution? What if you want to ignore "cases where running a container as root makes sense"[^rootless] and run containers as non-root anyways (perhaps to mitigate the risks of container escape)? That is precisely the question we are answering today!

Caddy (web server) and AdGuard Home (DNS server) bind to [*privileged ports*](https://www.w3.org/Daemon/User/Installation/PrivilegedPorts.html), and must therefore either be run as root or the ports must be made unprivileged. The former is an obvious solution, and not what we are interested in here, while the latter is less so; common advice is to run `sudo sysctl net.ipv4.ip_unprivileged_port_start = 53` on the host, however this makes *all* ports $\geq$ `53` unprivileged!

A better solution, which seemingly gets the best of both worlds, is to (1) bind these rootless containers to *unprivileged* ports and (2) configure firewall rules to redirect traffic from the privileged port to the corresponding unprivileged port[^redirect][^redirect2].
## Setup
### 1. System Configurations
In the [[homelab/v2/part 3|last post]], we installed `iptables-persistent` to persist `iptables` rules after system restarts. Now, it's time to configure some `iptables` rules.

Suppose we bind Caddy to ports `8000` and `4443`, and AdGuard Home to port `5300`. Then, we require the following `iptables` rules (stored in `/etc/iptables/rules.v4`):

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

These rules instruct the firewall to redirect UDP or TCP DNS requests from `53` -> `5300`, TCP HTTP requests from `80` -> `8000`, and UDP or TCP HTTPS requests from `443` -> `4443`. 

Now, all that's left is to deploy the services listening on these unprivileged ports. 
### 2. User Services
> [!note]
> All user services are defined in [my homelab repository](https://github.com/cbarkr/homelab/tree/main/srv). Each service will contain at least:
> - `.env`: Environment variables to configure the service
> - `compose.yml`: The [compose](https://github.com/compose-spec/compose-spec) file which defines each of the microservices which comprise the service
> - `README.md`: Documentation for the service
### 2.1. AdGuard Home
AdGuard Home acts as my DNS server, and is configured to perform *DNS rewrites* such that any request for a `*.lab` domain will be resolved to my server's IP address. For example, requests for `adguard.com` will be fulfilled by an upstream DNS server, while requests for `adguard.lab` will be fulfilled by AdGuard Home itself and resolve to my server's IP address.

Deploying AdGuard Home is quite simple as it is only a single container requiring two [volumes](https://docs.docker.com/engine/storage/volumes/) and three port bindings. It can be configured as follows.

> [!note]
> See https://github.com/AdguardTeam/AdGuardHome/wiki/Docker for full configuration details
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
      - '5300:53/udp' # unprivileged, firewall will redirect 53 -> 5300
      - '5300:53/tcp' # unprivileged, firewall will redirect 53 -> 5300
      - '8080:80/tcp'
    restart: always
```
#### Deploy
```bash
podman compose up -d
```
### 2.2. Caddy
Caddy acts as a reverse proxy, and is configured to forward traffic from specific `.lab` domains (redirected here by AdGuard Home) to the corresponding service. For example, traffic bound for `adguard.lab` is forwarded back to the container running AdGuard Home.

Deploying Caddy is almost as simple as deploying AdGuard Home as it, too, is a single container requiring three port bindings; however it also requires a `conf` directory containing a [`Caddyfile`](https://caddyserver.com/docs/caddyfile) as a [bind mount](https://docs.docker.com/engine/storage/bind-mounts/).

> [!note]
> See [https://hub.docker.com/_/caddy/#docker-compose-example](https://hub.docker.com/_/caddy/#docker-compose-example) for full configuration details
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
 
# See the next post!
seafile.lab {
	reverse_proxy host.containers.internal:8081
	tls internal
}

# See the next post!
immich.lab {
	reverse_proxy host.containers.internal:8082
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
      - '8000:80/tcp' # unprivileged, firewall will redirect 80 -> 8000
      - '4443:443/udp' # unprivileged, firewall will redirect 443 -> 4443
      - '4443:443/tcp' # unprivileged, firewall will redirect 443 -> 4443
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
## Example
Accessing `https://adguard.lab` (for example) should:
1. Trigger a DNS request for `adguard.lab`
2. Result in AdGuard Home rewriting the response such that `adguard.lab`->`<server-ip-address>
3. Redirect the request to `<server-ip-address>:443`
4. Result in Caddy proxying the request from port `443` to port `8080` on the server (i.e. the port running AdGuard Home's web interface)
## Wrapping Up
AdGuard Home should now be running as a DNS server and Caddy as a reverse proxy! Together, they can be used to use custom domains with HTTPS locally. 
## Summary
In this post, I described how to bind rootless containers to privileged ports and configure both AdGuard Home and Caddy in such a fashion. 

---

| Previous                      | Next |
| ----------------------------- | ---- |
| [[homelab/v2/part 3\|part 3]] | null |

[^podman]: https://www.redhat.com/en/blog/hpc-containers-scale-using-podman
[^rootless]: https://www.redhat.com/en/blog/basic-security-principles-containers
[^redirect]: https://linuxconfig.org/how-to-bind-a-rootless-container-to-a-privileged-port-on-linux
[^redirect2]: https://github.com/containers/podman/blob/main/rootless.md
