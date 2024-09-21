---
title: "part 4: nextcloud"
tags:
  - blog
date: 2024-09-19
---
Since [[part 3]], I made 2 small differences to my setup:
1. I got rid of the `services` pod, and have AdGuard Home running as a standalone container
2. I changed AdGuard's HTTP port binding from `80:80` to `8080:80`
## Preamble
I don't like Google Drive; I don't like the idea of storing my personal files on an advertising company's servers and I don't like overpaying for storage. The latter point is particularly pertinent: at the time of writing, 2 TB of storage from Google costs \$14 CAD per month; meanwhile, I already have a 2 TB HDD and 2 TB SSD collecting dust (\$0 per month). 

This is where Nextcloud comes in. Nextcloud is the [[foss|FOSS]] file storage / management system that I mentioned in [[part 0]]; it's something like a self-hosted Google Drive. 
## Setup
Like [[part 3]], I will be configuring this service as a user container using Podman. I used the [manual version](https://hub.docker.com/_/nextcloud/) of the Nextcloud image (as opposed to the [All-in-One version](https://github.com/nextcloud/all-in-one#nextcloud-all-in-one)) because I don't want anything fancy, just simple file management. Also, I'd rather do it myself, if possible. 

Unlike the last part, this service requires multiple communicating containers, which complicates things (negligibly). 
### Step 1: Acquire the necessary images
Apart from the main Nextcloud container, two additional containers, while not necessary, are recommended to improve the performance of Nextcloud. The first is an external database and the second is in-memory storage which will be used as a cache. 

While Nextcloud comes with a SQLite database by default, MySQL/MariaDB or PostgreSQL are preferable. Since I've used PostgreSQL in the past, I decided to branch out and try MariaDB (which is also emphasized in the documentation, though setup with PostgreSQL should be nearly identical). 

As for in-memory storage, Redis is usually the first that comes to mind (for me, at least), and that also seems to be the case with the Nextcloud team since Redis is the only solution suggested here. 

So we need three images:
1. Nextcloud
2. MariaDB (or PostgreSQL if you chose that route)
3. Redis

While not necessary, I chose to pull a specific version of each image (`30.0`, `11.5.2`, and `7.4-alpine`,respectively).
#### Using Podman CLI
```bash
podman pull docker.io/library/nextcloud:<tag>
podman pull docker.io/library/mariadb:<tag>
podman pull docker.io/library/redis:<tag>
```
#### Using Cockpit GUI
##### 1. Nextcloud
![[homalab_cockpit_podman_add_image.png]]
![[homelab_cockpit_podman_nextcloud_image.png]]
##### 2. MariaDB
![[homelab_cockpit_podman_mariadb_image.png]]
##### 3. Redis
![[homelab_cockpit_podman_redis_image.png]]
### Step 2: Create the necessary volumes
The `nextcloud` container provides 5 directories that can be mounted as volumes:
- `/var/www/html`: **Main folder, needed for updating**
- `/var/www/html/custom_apps`: Installed / modified apps
- `/var/www/html/config`: Local configuration
- `/var/www/html/data`: The actual data of your Nextcloud
- `/var/www/html/themes/<YOUR_CUSTOM_THEME>`: Theming/branding

For simplicity, I decided to store `/var/www/html` all together (although I would rather isolate the data). Speaking of data, I want to store this on a separate drive, as opposed to a regular volume, so I will be skipping this one down below. If you want to put your data in a regular volume, the steps to create such a volume are identical to any other. 

Next, the database needs somewhere to put it's data, so a volume for that is a good idea. The directory in the container that will be mounted to is `/var/lib/mysql` for MySQL/MariaDB (and `/var/lib/postgresql/data` for PostgreSQL). The volume is created like so:

```bash
podman volume create nextcloud-db
```
### Step 3: Create a pod
Since the Nextcloud, MariaDB, and Redis containers must communicate with one another, it's best to group them in a pod. This will look something like:

![[homelab_cockpit_podman_nextcloud_pod.png]]
#### Breakdown
1. To start, I name the pod "nextcloud"
2. Then, I specify the port mapping for the Nextcloud web server. I don't want this running on port `80` on my host, so I simply set it to something else. Since I already have something running on `8080`, I chose `8081`
3. The main folder `/var/www/html` is mounted to a local directory where I want the data to persist. This is on one of those 2TB drives I mentioned earlier
4. The database `/var/lib/mysql` is mounted to the volume `nextcloud-db` created earlier, which is located at `/home/$USER/.local/share/containers/storage/volumes/nextcloud-db/`
### Step 4: Create the MariaDB container
![[homelab_cockpit_podman_mariadb_container.png]]
![[homelab_cockpit_podman_mariadb_container2.png]]
#### Breakdown
1. I name the container `nextcloud-db`
2. I set a memory limit of 256MB to the container
3. Since I want my database to be available, I set the restart policy to "always"
4. Volume mappings can be skipped since they will be handled by the pod
5. Instead of manually configuring the DB, we can set environment variables
	1. `MYSQL_USER`: The name for the user
	2. `MYSQL_DATABASE`: The name of the database
	3. `MYSQL_PASSWORD`: The password for the user
	4. `MYSQL_ROOT_PASSWORD`: The root password

> [!note]
> `MYSQL_USER`, `MYSQL_DATABASE`, and `MYSQL_PASSWORD` will be used in the next step
### Step 5: Create the Redis container
![[homelab_cockpit_podman_redis_container.png]]
#### Breakdown
1. I name the container `nextcloud-redis`
2. In the command field, I added `--requirepass <password>` to set a default password for Redis
3. I set a memory limit of 128MB to the container
4. Since I want my database to be available, I set the restart policy to "always"
### Step 6: Create the Nextcloud container
![[media/homelab_cockpit_podman_nextcloud_container.png]]
![[homelab_cockpit_podman_nextcloud_container2.png]]
#### Breakdown
Similar to the last step,
1. I name the container `nextcloud-main`
2. I set a memory limit of 128MB to the container
3. Since I want the web server to be available, I set the restart policy to "always"
4. Port and volume mappings can be skipped since they will be handled by the pod
5. Let Nextcloud automatically configure the DB connection via environment variables. 
	1. `MYSQL_USER`: Same as earlier
	2. `MYSQL_DATABASE`: Same as earlier
	3. `MYSQL_PASSWORD`: Same as earlier
	4. `MYSQL_HOST`: The name of the container running the database; `nextcloud-db` in my case
	5. `REDIS_HOST`: The name of the container running Redis; `nextcloud-redis` in my case
	6. `REDIS_HOST_PASSWORD`: Same as the password passed with the `--requirepass` argument earlier
	7. `NEXTCLOUD_ADMIN_USER` (Optional): Preset an admin username
	8. `NEXTCLOUD_ADMIN_PASSWORD` (Optional): Preset an admin password
### Step 6: Open the Nextcloud UI
For me, this is running on port `8081`, so navigating to `<hostname>:8081` brings up the Nextcloud login page. If you didn't set the `NEXTCLOUD_ADMIN_*` environment variables, you will be asked to create a new admin account now. I forgot to take a screenshot of this part so just trust me. If everything is configured correctly, after login you should be redirected to the dashboard which, for me, looks like:

![[homelab_nextcloud_dashboard.png]]

Navigating to the "Files" page will reveal a bunch of guides and sample files, which I deleted immediately without reading. 

> [!note]
> If you didn't configure Redis, you'll notice that two files are locked: `Readme.md` and `Templates credits.md`

![[homelab_nextcloud_homepage.png]]
### Step 7: Using Nextcloud
Nextcloud's UI is quite intuitive, and thus I don't think it requires much explanation, if any. Click around, play around, etc.

The first thing I added was a small collection of silly tech memes that I had kicking around. 

![[homelab_nextcloud_memes.png]]

The next thing I did was employ [Google Takeout](https://takeout.google.com/) to export my entire Google Drive as one big `.tgz` (which I know how to extract thanks to `IMG.3881.jpeg`, shown above). The big task is to organize 7+ years of old files...
## Summary
In this post, I discussed how to setup Nextcloud using MariaDB and Redis as user containers in Cockpit using Podman.