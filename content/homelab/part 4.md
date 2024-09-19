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
I don't like Google Drive; I don't like the idea of storing my personal files on an advertising company's servers and I don't like overpaying for storage. The latter point is particularly pertinent: at the time of writing, 2 TB of storage from Google costs $14 CAD per month; meanwhile, I already have a 2 TB HDD and 2 TB SSD collecting dust ($0 per month). 

This is where Nextcloud comes in. Nextcloud is the [[foss|FOSS]] file storage / management system that I mentioned in [[part 0]]; it's something like a self-hosted Google Drive. 
## Setup
Like [[part 3]], I will be configuring this service as a user container using Podman. I used the [manual version](https://hub.docker.com/_/nextcloud/) of the Nextcloud image (as opposed to the [All-in-One version](https://github.com/nextcloud/all-in-one#nextcloud-all-in-one)) because I don't want anything fancy, just simple file management. Also, I'd rather do it myself, if possible. 

Unlike the last part, this service requires multiple communicating containers, which complicates things (negligibly). 
### Step 1: Acquire the necessary images
Apart from the main Nextcloud container, an external database container, while not 100% necessary, is recommended to store the data itself. If one is not specified, Nextcloud will default to a SQLite database, though this is not a very robust solution. Hence, they present two other options:
1. MySQL / MariaDB
2. PostgreSQL

Henceforth, I will focus on MariaDB for no particular reason apart from the fact that it is emphasized in Nextcloud's documentation, but setup with PostgreSQL should be nearly identical.

So we need two images:
1. Nextcloud
2. MariaDB (or your DB of choice)

While not necessary, I chose to pull a specific version of each image (`30.0` and `11.5.2`, respectively).
#### Using Podman CLI
```
podman pull docker.io/library/nextcloud:<tag>
podman pull docker.io/library/mariadb:<tag>
```
#### Using Cockpit GUI
##### 1. Nextcloud
![[homalab_cockpit_podman_add_image.png]]
![[homelab_cockpit_podman_nextcloud_image.png]]
##### 2. MariaDB
![[homelab_cockpit_podman_mariadb_image.png]]
### Step 2: Create the necessary volumes
The `nextcloud` container provides 5 directories that can be mounted as volumes:
- `/var/www/html`: **Main folder, needed for updating**
- `/var/www/html/custom_apps`: Installed / modified apps
- `/var/www/html/config`: Local configuration
- `/var/www/html/data`: The actual data of your Nextcloud
- `/var/www/html/themes/<YOUR_CUSTOM_THEME>`: Theming/branding

For my purposes, I only really need `/var/www/html` from this list. The data itself is stored in the database, which for MariaDB is `/var/lib/mysql`. For the database, I will be mounting a local directory on a separate drive, as opposed to a volume, so all I need to do here is:

```bash
podman volume create nextcloud-main
```
### Step 3: Create a pod
Since the Nextcloud container and MariaDB container must communicate with one another, it's best to group them in a pod. This will look something like:

![[homelab_cockpit_podman_nextcloud_pod.png]]
#### Breakdown
1. To start, I name the pod "nextcloud"
2. Then, I specify the port mapping for the Nextcloud web server. I don't want this running on port `80` on my host, so I simply set it to something else. Since I already have something running on `8080`, I chose `8081`.
3. For the main folder, I mounted the volume `nextcloud-main` created earlier, which is located at `/home/$USER/.local/share/containers/storage/volumes/nextcloud-main/`
4. For the database, I mounted a local directory where I want the data to persist. This is on one of those 2TB drives I mentioned earlier. 
### Step 4: Create the MariaDB container
![[homelab_cockpit_podman_mariadb_container.png]]
![[homelab_cockpit_podman_mariadb_container2.png]]
#### Breakdown
1. I name the container `nextcloud-db`
2. I set a memory limit of 256MB to the container
3. Since I want my database to be available, I set the restart policy to "always"
4. Volume mappings can be skipped since they will be handled by the pod
5. Instead of manually configuring the DB, we can set environment variables

> [!note]
> `MYSQL_USER`, `MYSQL_DATABASE`, and `MYSQL_PASSWORD` will be used in the next step
### Step 5: Create the Nextcloud container
![[homelab_cockpit_podman_nextcloud_container.png]]
![[homelab_cockpit_podman_nextcloud_container2.png]]
#### Breakdown
Similar to the last step,
1. I name the container `nextcloud-main`
2. I set a memory limit of 128MB to the container
3. Since I want the web server to be available, I set the restart policy to "always"
4. Port and volume mappings can be skipped since they will be handled by the pod
5. Let Nextcloud automatically configure the DB connection via environment variables. Notice that `MYSQL_HOST` is set to `nextcloud-db`: since both containers are in the same namespace, we can simply address the DB container by name!
### Step 6: Open the Nextcloud UI
For me, this is running on port `8081`, so navigating to `<hostname>:8081` brings up the Nextcloud login page. I forgot to take a screenshot of this part so just trust me that all it asks for is to create an admin account. If everything is configured correctly, you should be redirected to the dashboard which, for me, looks like:

![[homelab_nextcloud_dashboard.png]]

Navigating to the "Files" page will reveal a bunch of guides and sample files, which I deleted immediately without reading. If you do this, you'll notice that two files are locked: `Readme.md` and `Templates credits.md`. `Readme.md` is expected, since this is the file that holds the contents of the markdown container at the top of the page, but `Templates credits.md` is still somewhat of a mystery to me (hence my one TODO).

![[homelab_nextcloud_homepage.png]]
### Step 7: Using Nextcloud
Nextcloud's UI is quite intuitive, and thus I don't think it requires much explanation, if any. Click around, play around, etc.

So far, all my Nextcloud instance stores are some silly tech memes since I have yet to migrate the contents of my Google Drive. 

![[homelab_nextcloud_memes.png]]

Employing [Google Takeout](https://takeout.google.com/), the act of exporting and importing should be relatively painless, but as I also want to organize 7+ years of old files, what comes after is another story... Until next time!
## Summary
In this post, I discussed how to setup Nextcloud using MariaDB as a user container in Cockpit using Podman.