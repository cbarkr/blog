---
title: "part 2: plan"
tags:
  - blog
  - homelab
date: 2026-01-03
---
While setting up my new [[homelab/v2/part 1|hardware]], I reflected on the limitations and tribulations I experienced working on the [[homelab/v1/index|first iteration]]. The current iteration is unlikely to be the last, hence I wanted to identify and resolve any issues while I had this opportunity. After reviewing each of my write-ups from the previous iteration, I came to the following conclusions:

1. Infra as code is non-negotiable -> services definitions, configurations, etc. must be declarative and version controlled
2. Solutions that *just work* are not good enough -> do it right or don't do it at all
3. Sweat the small stuff -> omissions and undocumented ad hoc decisions introduce undue ambiguity

Henceforth, all services will be defined as [compose](https://github.com/compose-spec/compose-spec) files and deployed using [podman-compose](https://github.com/containers/podman-compose) (although [Quadlet](https://www.redhat.com/en/blog/quadlet-podman) is the preferred option with Podman, it and [podlet](https://github.com/containers/podlet) do not support string interpolation, which I use for both volume and environment variable configuration). Such files are self-documenting and unambiguous, perfect for repeatable deployments. 

In the migration process, warnings from previous posts will be addressed; namely, the "unprivileged users vs privileged ports" problem with [[homelab/v1/part 3|AdGuard Home]] and [[part 6|Caddy]]. A major motivation of this whole endeavour is to learn more about network security and system security, thus it is counterproductive to tolerate insecure configurations for the sake of convenience. 

As part of sweating the small stuff, I wanted to put together a network diagram for my own sake. So here it is: 

![[network.png]]

Note that I've already defined and deployed everything as compose files using secure configurations, I'm just behind on making write-ups for them :P. https://github.com/cbarkr/homelab will always have the latest scoop, though.
## Summary
This post describes my next steps in rebuilding the homelab.

---

| Previous                      | Next                          |
| ----------------------------- | ----------------------------- |
| [[homelab/v2/part 1\|part 1]] | [[homelab/v2/part 3\|part 3]] |
