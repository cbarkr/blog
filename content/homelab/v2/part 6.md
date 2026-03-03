---
title: "part 6: degoogling with seafile and immich"
tags:
  - blog
  - homelab
date: 2026-03-02
---
I'm a big fan of [[foss|open source]]. Same with being in control of my data. 

Since most of my data previously resided in Google Drive and Photos, these were the first services on the chopping block when I decided to start self-hosting. Seafile and Immich replaced them some time ago now and I don't think I'll ever look back.
## Setup
> [!note]
> All user services are defined in [my homelab repository](https://github.com/cbarkr/homelab/tree/main/srv). Each service will contain at least:
> - `.env`: Environment variables to configure the service
> - `compose.yml`: The [compose](https://github.com/compose-spec/compose-spec) file which defines each of the microservices which comprise the service
> - `README.md`: Documentation for the service
### 1. Seafile
#### Configuration
> [!note]
> See https://manual.seafile.com/11.0/docker/deploy_seafile_with_docker/ for full configuration details
##### `.env`
```
DB_LOCATION=<...>
DATA_LOCATION=<...>
DB_ROOT_PASSWORD=<...>
SEAFILE_ADMIN_EMAIL=<...>
SEAFILE_ADMIN_PASSWORD=<...>
SEAFILE_SERVER_HOSTNAME=<...>
```
##### `compose.yml`
```yml
name: seafile

services:
  database:
    container_name: seafile_mariadb
    image: docker.io/library/mariadb:10.6
    volumes: ${DB_LOCATION}:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_LOG_CONSOLE: true
    restart: always

  cache:
    container_name: seafile_memcached
    image: docker.io/library/memcached:1.6.32
    restart: always

  seafile_server:
    container_name: seafile_server
    image: docker.io/seafileltd/seafile-mc:11.0.12
    volumes: ${DATA_LOCATION}:/shared
    environment:
      DB_HOST: database
      DB_ROOT_PASSWD: ${DB_ROOT_PASSWORD}
      SEAFILE_ADMIN_EMAIL: ${SEAFILE_ADMIN_EMAIL}
      SEAFILE_ADMIN_PASSWORD: ${SEAFILE_ADMIN_PASSWORD}
      SEAFILE_SERVER_HOSTNAME: ${SEAFILE_SERVER_HOSTNAME}
      SEAFILE_SERVER_LETSENCRYPT: false
      FORCE_HTTPS_IN_CONF: true
    ports: '8081:80'
    depends_on:
      - database
      - cache
    restart: always
```
#### Deployment
```bash
podman compose up -d
```
#### Setup
Get a shell in the container:

```bash
podman exec -it <container-id> /bin/bash
```

Open the Seafile settings:

```bash
nano seafile/data/seafile/conf/seahub_settings.py
```

Add the domain to the trusted origins:

```diff
- CSRF_TRUSTED_ORIGINS = []
+ CSRF_TRUSTED_ORIGINS = ["https://seafile.lab"]
```

Then restart the pod:

```bash
podman compose restart
```
### 2. Immich
> [!note]
> See https://docs.immich.app/install/docker-compose/ for full configuration details
#### Configuration
##### `.env`
```
UPLOAD_LOCATION=<...>
DB_DATA_LOCATION=<...>
IMMICH_VERSION=<...>
DB_PASSWORD=<...>
DB_USERNAME=<...>
DB_DATABASE_NAME=<...>
```
##### `compose.yml`
```yml
name: immich

services:
  database:
    container_name: immich_postgres
    image: ghcr.io/immich-app/postgres:14-vectorchord0.4.3-pgvectors0.2.0@sha256:bcf63357191b76a916ae5eb93464d65c07511da41e3bf7a8416db519b40b1c23
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_DB: ${DB_DATABASE_NAME}
      POSTGRES_INITDB_ARGS: '--data-checksums'
      # Uncomment the DB_STORAGE_TYPE: 'HDD' var if your database isn't stored on SSDs
      # DB_STORAGE_TYPE: 'HDD'
    volumes:
      # Do not edit the next line. If you want to change the database storage location on your system, edit the value of DB_DATA_LOCATION in the .env file
      - ${DB_DATA_LOCATION}:/var/lib/postgresql/data
    shm_size: 128mb
    restart: always

  redis:
    container_name: immich_redis
    image: docker.io/valkey/valkey:9@sha256:fb8d272e529ea567b9bf1302245796f21a2672b8368ca3fcb938ac334e613c8f
    healthcheck:
      test: redis-cli ping || exit 1
    restart: always

  immich-server:
    container_name: immich_server
    image: ghcr.io/immich-app/immich-server:${IMMICH_VERSION:-release}
    # extends:
    #   file: hwaccel.transcoding.yml
    #   service: cpu # set to one of [nvenc, quicksync, rkmpp, vaapi, vaapi-wsl] for accelerated transcoding
    volumes:
      # Do not edit the next line. If you want to change the media storage location on your system, edit the value of UPLOAD_LOCATION in the .env file
      - ${UPLOAD_LOCATION}:/data
      - /etc/localtime:/etc/localtime:ro
    env_file:
      - .env
    ports:
      - '8082:2283'
    depends_on:
      - redis
      - database
    restart: always
    healthcheck:
      disable: false

  immich-machine-learning:
    container_name: immich_machine_learning
    # For hardware acceleration, add one of -[armnn, cuda, rocm, openvino, rknn] to the image tag.
    # Example tag: ${IMMICH_VERSION:-release}-cuda
    image: ghcr.io/immich-app/immich-machine-learning:${IMMICH_VERSION:-release}
    # extends: # uncomment this section for hardware acceleration - see https://docs.immich.app/features/ml-hardware-acceleration
    #   file: hwaccel.ml.yml
    #   service: cpu # set to one of [armnn, cuda, rocm, openvino, openvino-wsl, rknn] for accelerated inference - use the `-wsl` version for WSL2 where applicable
    volumes:
      - model-cache:/cache
    env_file:
      - .env
    restart: always
    healthcheck:
      disable: false

volumes:
  model-cache:
```
#### Deployment
```bash
podman compose up -d
```
### 3. Caddy
Had we not [[homelab/v2/part 4#`conf/Caddyfile`|pre-configured the Caddyfile]] to point `seafile.lab` -> `localhost:8081` and `immich.lab` -> `localhost:8082`, this would be the place to do it. But since we have, there is nothing more to do! Simply visiting those domains should let us access Seafile and Immich, respectively, without issue. 
## Data Migration
Simply export your data from Google using [Takeout](https://takeout.google.com), for example, and re-upload in Seafile and Immich, as necessary. 
## Summary
In this post, I walked through a deployment of Seafile and Immich as rootless Podman containers to replace Google Drive and Photos. 

---

| Previous                      | Next |
| ----------------------------- | ---- |
| [[homelab/v2/part 5\|part 5]] | null |
