---
title: "part 5: rsync backups"
tags:
  - blog
  - homelab
date: 2026-01-11
---
> [!note]
> This is merely a rewrite of my [[homelab/v1/part 7|original backup post]] with minor changes

I like to keep things simple and stupid wherever possible. So when I thought about making automated backups of my data, I turned to `cron` and `rsync`.
## Background
`cron` is a daemon to execute scheduled commands[^cron] and `rsync` is a fast, versatile, remote (and local) file-copying tool[^rsync]. Together, they can be used to schedule backups from the command line.

> [!warning]
> If you care about your data, follow the [3-2-1 Backup Rule](https://en.wikipedia.org/wiki/Backup#3-2-1_Backup_Rule), which, in short, states:
> - 3 copies of the data should exist
> - 2 different types of media should be used to store the data
> - 1 copy of the data should be kept offsite, in a remote location

## Setup
### Step 1: Create a `.env`
Rather than bake the source and destination directories into the backup script, I opted to house them in a `.env` file:

```
BACKUP_SRC=<...>
BACKUP_DST=<...>
```
### Step 2: Create a backup script
Following a couple of guides (such as [this](https://linuxmind.dev/2025/09/02/automatic-backups-with-rsync-and-cron/) and [this](https://www.tecmint.com/linux-rsync-incremental-backup-cron/)), I put together the following, quite simple `backup.sh` script:

```bash
#!/bin/bash

# Activate `.env` relative to script location
dirpath="$(dirname "$0")"
envpath="$dirpath/.env"
source "$envpath"

# Set vars for backup
src=${BACKUP_SRC}
dst=${BACKUP_DST}
log="/var/log/backup.log"

echo "Backup started at $(date)" >> "$log"

# Perform the backup itself
rsync -av --delete "$src" "$dst" >> "$log" 2>&1

echo "Backup completed at $(date)" >> "$log"
```

This script simply runs [`rsync`](https://linux.die.net/man/1/rsync) to backup files from `BACKUP_SRC` to `BACKUP_DST` while logging to the file `/var/log/backup.log`. The options are as follows: 

- `-a` (archive): Recursively transfers files, preserving almost everything (symlinks, permissions, modification times, etc.)
- `-v` (verbose): Increases the amount of information logged during the transfer
- `--delete`: Deletes files from the destination that are no longer present at the source

Before moving on to the next step (scheduling), I ran the script manually to get a baseline. 
### Step 3: Schedule with `crontab`
With the help of https://cron.help/, I devised the following (system) `crontab`:

```bash
0 3 * * 1 /home/lab/homelab/bin/backup.sh
```

This schedules the execution of `backup.sh` every Monday at 3AM (while I am (hopefully) asleep). After it has run, the contents of `/var/log/backup.log` should indicate if the backup was successful:

```bash
[~] $ cat /var/log/backup.log | tail
<Files backed up go here>
sent <l> bytes  received <m> bytes  <n> bytes/sec
total size is <o>  speedup is <p>
Backup completed at Mon 22 Dec 2025 03:00:02 AM PST
```
## Summary
Backups don't have to be hard! This simple `rsync` + `cron` combination automatically schedules backups, providing peace of mind with minimal effort. 

---

| Previous                      | Next                          |
| ----------------------------- | ----------------------------- |
| [[homelab/v2/part 4\|part 4]] | [[homelab/v2/part 6\|part 6]] |
[^cron]: https://linux.die.net/man/8/cron
[^rsync]: https://linux.die.net/man/1/rsync