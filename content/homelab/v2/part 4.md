---
title: "part 4: binding rootless containers to privileged ports; adguard and caddy for local domains with https"
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

A better solution, which seemingly obtains the best of both worlds, is to (1) configure firewall rules to redirect traffic from the privileged ports to corresponding *unprivileged* ports and (2) bind our rootless containers to these unprivileged ports[^redirect][^redirect2].
## Setup
### 1. System Configurations
In the [[homelab/v2/part 3|last post]], we installed `ufw` to make managing `iptables` rules a little simpler. We can use `ufw` / `iptables` to redirect traffic using network address translation (NAT) - in our case, we want to translate requests from privileged ports (e.g. `53`, `80`, `443`) to unprivileged ports (e.g. `5300`, `8000`, `4443`). 
#### 1.1. Update Firewall Rules
As we want to allow HTTP(S) and DNS connections (for Caddy and AdGuard Home, respectively), we need to open those ports:

```bash
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 53
```

The unprivileged ports must be opened up as well (as for why, you will see in a moment):

```bash
sudo ufw allow 4443
sudo ufw allow 5300
sudo ufw allow 8000
sudo ufw allow 8080
sudo ufw allow 8081
sudo ufw allow 8082
```
#### 1.2. Configuring NAT Rules
Now we define the rules followed to perform the actual routing / translation. Using the privileged -> unprivileged mapping defined earlier, we can add the following `iptables` rules to the end of `/etc/ufw/before.rules`:

```
*nat
:PREROUTING ACCEPT [0:0]
:POSTROUTING ACCEPT [0:0]

-A PREROUTING -p udp -m udp --dport 53 -j REDIRECT --to-ports 5300
-A PREROUTING -p tcp -m tcp --dport 53 -j REDIRECT --to-ports 5300
-A PREROUTING -p tcp -m tcp --dport 80 -j REDIRECT --to-ports 8000
-A PREROUTING -p tcp -m tcp --dport 443 -j REDIRECT --to-ports 4443
-A PREROUTING -p udp -m udp --dport 443 -j REDIRECT --to-ports 4443

COMMIT
```

These rules instruct the firewall to redirect UDP or TCP DNS requests from `53` -> `5300`, TCP HTTP requests from `80` -> `8000`, and UDP or TCP HTTPS requests from `443` -> `4443` *as soon as they come in*[^iptables]. The reason why "the unprivileged ports \[`5300`, `8000`, and `4443`\] must be opened up as well" is that the `PREROUTING` chain of the `nat` table redirects incoming packets *before* a routing decision is made. Thus, ports `5300`, `8000`, and `4443` must be allow-listed, otherwise the routing decision will always be a bit fat `DROP`. For context, please consult the following diagram: 

> [!note]
> Full credit for the following diagram goes to Phil Hagen! Find the original post [here](https://stuffphilwrites.com/2014/09/iptables-processing-flowchart/).

![[iptables_flowchart.png]]

As far as I can tell (based on the `man` page[^iptables] and relevant guides[^redirect3][^redirect4][^redirect5][^redirect6]), there does not exist an (obvious) better way to perform port redirection on incoming packets *after* the routing decision is made, hence this is the solution I am sticking with. I accept the risk of allow-listing select unprivileged ports (since they are already accessible via the privileged ports, after all).
#### 1.3. Reload
For the preceding changes to come into effect, `ufw` must be reloaded like so:

```bash
sudo ufw reload
```

Now, all that's left is to deploy the services listening on these unprivileged ports. 
### 2. User Services
> [!note]
> All user services are defined in [my homelab repository](https://github.com/cbarkr/homelab/tree/main/srv). Each service will contain at least:
> - `.env`: Environment variables to configure the service
> - `compose.yml`: The [compose](https://github.com/compose-spec/compose-spec) file which defines each of the microservices which comprise the service
> - `README.md`: Documentation for the service
#### 2.1. AdGuard Home
AdGuard Home acts as my DNS server and is configured to perform *DNS rewrites* such that any request for a `*.lab` domain will be resolved to my server's IP address. For example, requests for `adguard.com` will be fulfilled by an upstream DNS server, while requests for `adguard.lab` will be fulfilled by AdGuard Home itself and resolve to my server's IP address.
##### Configuration
Deploying AdGuard Home is quite simple as it is only a single container requiring two [volumes](https://docs.docker.com/engine/storage/volumes/) and three port bindings. It can be configured as follows.

> [!note]
> See https://github.com/AdguardTeam/AdGuardHome/wiki/Docker for full configuration details
###### `.env`
```
WORK_DIR=<...>
CONF_DIR=<...>
```
###### `compose.yml`
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
##### Deployment
```bash
podman compose up -d
```
#### 2.2. Caddy
Caddy acts as a reverse proxy and is configured to forward traffic from specific `.lab` domains (redirected here by AdGuard Home) to the corresponding service. For example, traffic bound for `adguard.lab` is forwarded back to the container running AdGuard Home.
##### Aside
Before proceeding to the configuration, I want to first clarify the second half of why "the unprivileged ports \[`8080`, `8081`, and `8082`\] must be opened up as well". It all comes down to [pasta](https://passt.top/passt/about/) - the networking application (*Pack A Subtle Tap Abstraction*), not the food. As of Podman 5.0, "pasta" is the default networking application[^pasta], which has the following implication:

> Pasta, by default, does not use Network Address Translation (NAT). This means it will copy the host address into the container as well, which means both the host and container namespace use the same IP address. This, in turn, means if you try to connect to the host IP from the container, it will refer to itself, not the host.

To overcome this problem, an IP address is mapped to the host and the `host.containers.internal` is mapped to this IP address in `/etc/hosts`. Thus, `host.containers.internal` resolves to the host; however, it must be noted that requests made to the host from the container are treated as *incoming packets* and the ports to which those packets are addressed must therefore be allow-listed. 

My Caddy configuration uses `host.containers.internal:<port>` to address the service running on the host exposed on port `<port>`. Currently, the only such ports are `8080`, `8081`, and `8082`, and, per the prior discussion, these ports must be opened on the firewall. 

> [!note]
> That may have been more than "a moment", but I hope you get the point!
##### Configuration
Deploying Caddy is almost as simple as deploying AdGuard Home as it, too, is a single container requiring three port bindings; however it also requires a `conf` directory containing a [`Caddyfile`](https://caddyserver.com/docs/caddyfile) as a [bind mount](https://docs.docker.com/engine/storage/bind-mounts/).

> [!note]
> See [https://hub.docker.com/_/caddy/#docker-compose-example](https://hub.docker.com/_/caddy/#docker-compose-example) for full configuration details
###### `.env`
```
DATA_DIR=<...>
CONF_DIR=<...>
```
###### `conf/Caddyfile`
```
adguard.lab {
	reverse_proxy host.containers.internal:8080
	tls internal
}
 
# See part 6!
seafile.lab {
	reverse_proxy host.containers.internal:8081
	tls internal
}

# See part 6!
immich.lab {
	reverse_proxy host.containers.internal:8082
	tls internal
}
```
###### `compose.yml`
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
##### Deployment
```bash
podman compose up -d
```
## Example
Accessing `https://adguard.lab` (for example) should:
1. Trigger a DNS request for `adguard.lab`
2. Result in AdGuard Home rewriting the response such that `adguard.lab`->`<server-ip-address>`
3. Redirect the request to `<server-ip-address>:443`
4. Result in Caddy proxying the request from port `443` to port `8080` on the server (i.e. the port running AdGuard Home's web interface)
## Summary
In this post, I described how to bind rootless containers to privileged ports and configure both AdGuard Home and Caddy in such a fashion. Together, they can be used to define custom local domains with HTTPS.

---

| Previous                      | Next                          |
| ----------------------------- | ----------------------------- |
| [[homelab/v2/part 3\|part 3]] | [[homelab/v2/part 5\|part 5]] |

[^podman]: https://www.redhat.com/en/blog/hpc-containers-scale-using-podman
[^rootless]: https://www.redhat.com/en/blog/basic-security-principles-containers
[^redirect]: https://linuxconfig.org/how-to-bind-a-rootless-container-to-a-privileged-port-on-linux
[^redirect2]: https://github.com/containers/podman/blob/main/rootless.m
[^redirect3]: https://www.baeldung.com/linux/port-redirection
[^redirect4]: https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/7/html/security_guide/sec-configuring_nat_using_nftables#sec-Configuring_a_redirect_using_nftables
[^redirect5]: https://wiki.nftables.org/wiki-nftables/index.php/Performing_Network_Address_Translation_(NAT)
[^redirect6]: https://www.cyberciti.biz/faq/linux-port-redirection-with-iptables/
[^iptables]: https://linux.die.net/man/8/iptables
[^pasta]: https://blog.podman.io/2024/10/podman-5-3-changes-for-improved-networking-experience-with-pasta/