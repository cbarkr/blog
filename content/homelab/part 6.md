---
title: "part 6: caddy"
tags:
  - blog
  - homelab
date: 2025-04-25
---
Long time no see! For the past several months, I've been pre-occupied with school, work, and #ctf. Today, however, I finally address something that I've been meaning to do for a very long time: enable HTTPS and use local domains for my services. To do so, I leverage DNS rewrites using [[part 3|AdGuard]] and auto-HTTPS from [Caddy](https://caddyserver.com/).
# Preface
Due to the complexities of networking with rootless containers (at the time of writing), this probably could have been a lot easier had I used Docker instead of Podman. I simply could not get this working (nicely) using a purely containerized setup, so I ended up violating one of my [[part 2#2. Requirements|requirements]] and installing Caddy on bare metal. It made life a lot simpler and I don't see any consequences from doing so. Sue me.
# Setup
## Step 1: DNS Rewrites
DNS rewrites tell AdGuard: "hey, when you receive DNS queries for \<URL or domain wildcard goes here\>, please actually return \<IP goes here\>". Since AdGuard already operates as my DNS server, this is pretty trivial. Just go to "Filters" > "DNS rewrites", then set the URL/wildcard and the IP address to route to. Now, when AdGuard receives DNS queries for that domain, it will directly forward requests to the specified IP address rather than querying an upstream DNS provider. 

I want all requests with the top level domain `.lab` to be handled internally. So, I set a wildcard like so:

![[DNS rewrites.png]]

Now, all requests to, say, `test.lab` are rewritten by AdGuard:

![[rewrite log.png]]

> [!note]
> If requests from a client are not being rewritten, try:
> 1. Clearing AdGuard's DNS cache: "Settings" > "DNS settings" > "DNS cache configuration" > "Clear cache"
> 2. Restarting your AdGuard container
> 3. Running `nslookup @<ip-running-adguard> <rewrite-URL>` to force AdGuard as the DNS server, thereby verifying that it is an issue with AdGuard and not the client
## Step 2: Install Caddy
Since I am [installing Caddy](https://caddyserver.com/docs/install) on bare metal, I opted to use the official package for my distro, [Debian](https://caddyserver.com/docs/install#debian-ubuntu-raspbian). Apart from installing Caddy's GPG keys, this is as simple as `sudo apt install caddy`. The `caddy` service will start automatically. To verify that Caddy is running, navigate to `http://localhost` (port 80 by default), and see if you're served an HTML file containing something along the lines of "Your web server is working. Now make it work for you. 💪".
## Step 3: Configuring Caddy
Caddy will install a config file at `/etc/caddy/Caddyfile`. By [default](https://github.com/caddyserver/dist/blob/master/config/Caddyfile) (ignoring the comments), this looks something like:

```bash
:80 {
	root * /usr/share/caddy
	file_server
}
```

I removed everything and started fresh. All I intend on routing for now is AdGuard and [[part 5|Seafile]], so I need only 2 rules. Quite simply:

```bash
adguard.lab {
	reverse_proxy localhost:8080
	tls internal
}

seafile.lab {
	reverse_proxy localhost:8081
	tls internal
}
```

[`reverse_proxy` ](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) tells Caddy where to proxy requests to and [`tls internal`](https://caddyserver.com/docs/caddyfile/directives/tls) tells it to use its internal, local certificate authority. That is, all certificates are self-signed. This isn't a problem for me, so I plan to leave it as-is for now.

Navigating to `http://adguard.lab`, for example, the connection is upgraded to HTTPS! However, since the certificates are self-signed, I had to set an exception for the domain:

![[HTTPS.png]]

It's as simple as that! With very little work, I now have HTTPS and nice local domains for my internal services. 
## Step 4: Fixing Weird Bugs
AdGuard cooperated without any real troubles; Seafile, on the other hand, didn't play quite so nice. It would let me get as far as the login page, but after logging in, displayed a Django error stating "CSRF Verification Failed. Request aborted.". This seems to be a [known issue](https://forum.seafile.com/t/csrf-verification-failed/22832/2), which was resolved by setting the new domain as a CSRF trusted origin in Seafile's config. The file, `seafile/data/seafile/conf/seahub_settings.py`, was in a bind mount for my Seafile containers; so I simply appended `CSRF_TRUSTED_ORIGINS = ["https://seafile.lab"]` and restarted the container. No issues now!
# Summary
Configuring local domains with HTTPS is extremely simple using AdGuard and Caddy. AdGuard handles DNS rewrites, allowing one to use domains locally without the need to purchase one. Caddy handles the (reverse) proxying between requests to the internal domain and its intended destination, adding HTTPS in the process. 

---

| Previous   | Next |
| ---------- | ---- |
| [[part 5]] | null |
