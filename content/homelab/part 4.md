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

While Nextcloud comes with a SQLite database by default, it's simply too lite for most loads; heavy-hitters like MySQL/MariaDB or PostgreSQL are greatly preferable. Since I've used PostgreSQL in the past, I decided to branch out and try MariaDB for a change. MariaDB is emphasized in the documentation, though setup with PostgreSQL should be nearly identical.

As for in-memory storage, Redis is usually the first that comes to mind (for me, at least). This also appears to be the case with the Redis team! That is, Redis is the only "option" given :P (on the Docker Hub page, at least). More options are given on the [official docs](https://docs.nextcloud.com/server/19/admin_manual/configuration_server/caching_configuration.html#).

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
![[homalab_cockpit_podman_add_image.png]]
##### 1. Nextcloud
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

For simplicity's sake, I decided to store `/var/www/html` all together although I would rather isolate the data. This will be mounted to a local directory on a separate drive, as opposed to a regular volume. If you would like to put your data in a regular volume, simply create another volume for it, and point  `/var/www/html` to it in step 3.

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
1. The container is named `nextcloud-db`
2. A memory limit of 256MB is applied to the container
3. The restart policy is set to "Always" so the container always restarts, should it stop unexpectedly
4. Volume mappings are skipped since they will be handled by the pod
5. Instead of manually configuring the DB, environment variables are used to pass configurations in
	1. `MYSQL_USER`: The name for the user
	2. `MYSQL_DATABASE`: The name of the database
	3. `MYSQL_PASSWORD`: The password for the user
	4. `MYSQL_ROOT_PASSWORD`: The root password

> [!note]
> `MYSQL_USER`, `MYSQL_DATABASE`, and `MYSQL_PASSWORD` will be used in step 6
### Step 5: Create the Redis container
![[homelab_cockpit_podman_redis_container.png]]
#### Breakdown
1. The container is named `nextcloud-redis`
2. In the command field, the parameter `--requirepass` is used to set a default password
3. A memory limit of 128MB is applied to the container
4. The restart policy is set to "Always" so the container always restarts, should it stop unexpectedly
### Step 6: Create the Nextcloud container
![[media/homelab_cockpit_podman_nextcloud_container.png]]
![[homelab_cockpit_podman_nextcloud_container2.png]]
#### Breakdown
1. The container is named `nextcloud-main`
2. A memory limit of 128MB is applied to the container
3. The restart policy is set to "Always" so the container always restarts, should it stop unexpectedly
4. Port and volume mappings are skipped since they will be handled by the pod
5. Instead of manually configuring the DB, environment variables are used to pass configurations in. Nextcloud will automatically configure the database and Redis connections using these values
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

The next thing I did was employ [Google Takeout](https://takeout.google.com/) to export my entire Google Drive as one big `.tgz` (which I know how to extract thanks to `IMG.3881.jpeg` shown above!). For nearly 8 years, I've stored most of [my photography](https://www.cbarkr.com/photos) on Google Drive, so this archive is quite big. Fortunately, it's *mostly* organized, so uploading everything to Nextcloud won't be too painful.
## Update
My main complaint thus far is that thumbnails are *very* slow to generate. And when I say *very* slow, I mean painfully so. So much so that I want to scrap Nextcloud altogether and try something else.

Here's what I've tried to do to combat the problem, as of yet finding no success:
1. Use Redis (as I did in this post!)
2. [Downscale preview quality](https://docs.nextcloud.com/server/19/admin_manual/configuration_files/previews_configuration.html?highlight=thumbnail#jpeg-quality-setting) by 50%
3. Install the [Preview Generator](https://apps.nextcloud.com/apps/previewgenerator) app (and configure it according to [this](https://github.com/nextcloud/previewgenerator/issues/211#issuecomment-739731976))
4. Configure cron jobs (which seem to be a bit of a nightmare with Nextcloud)

I hoped the Preview Generator app specifically would help, but so far it appears to have no effect. As instructed in the docs, I ran `./occ preview:generate-all -vvv` and found that it only tries the first folder in my drive before giving up. 

Or since cron jobs seemingly weren't working for me, I tried

```bash
podman exec -u www-data nextcloud-main php /var/www/html/cron.php
```

and found that Nextcloud literally DoS'd itself in the process. I didn't get a screenshot of that particular instance, but what follows is one I took shortly beforehand, in which CPU usage skyrockets while (presumably) trying to generate image previews:

![[homelab_cockpit_podman_preview_cpu_usage.png]]

I still have two avenues left:
1. Fix cron jobs
2. Downgrade the MariaDB version (Nextcloud complains that it would prefer >=10.6 and <=11.4)

If neither of these solve my problems, I shall be moving on to something else. [Seafile](https://www.seafile.com/en/home/) seems like a good option for my use case.
## Summary
In this post, I discussed how to setup Nextcloud using MariaDB and Redis as user containers in Cockpit using Podman. 