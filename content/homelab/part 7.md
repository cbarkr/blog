---
title: "part 7: backups"
tags:
  - blog
  - homelab
date: 2025-12-22
---
I like to keep things simple and stupid wherever possible. So when I thought about making automated backups of my data, I turned to `cron` and `rsync`.
## Background
`cron` is a daemon to execute scheduled commands[^cron] and `rsync` is a fast, versatile, remote (and local) file-copying tool[^rsync]. Together, they can be used to schedule backups from the command line.

> [!warning]
> If you care about your data, follow the [3-2-1 Backup Rule](https://en.wikipedia.org/wiki/Backup#3-2-1_Backup_Rule), which, in short, states:
> - 3 copies of the data should exist
> - 2 different types of media should be used to store the data
> - 1 copy of the data should be kept offsite, in a remote location
## Setup 
### Step 1: Create a backup script
Following a couple of guides (such as [this](https://linuxmind.dev/2025/09/02/automatic-backups-with-rsync-and-cron/) and [this](https://www.tecmint.com/linux-rsync-incremental-backup-cron/)), I put together the following, quite simple `backup.sh` script:

```bash
#!/bin/bash

src="/mnt/drive1"
dst="/mnt/drive2"
log="/var/log/backup.log"

echo "Backup started at $(date)" >> "$log"

rsync -av --delete "$src" "$dst" >> "$log" 2>&1

echo "Backup completed at $(date)" >> "$log"
```

Here, I'm backing up the contents of the drive mounted at `/mnt/drive1` (my internal SSD) to the drive mounted at `/mnt/drive2` (an external USB HDD). I maintain a log file `/var/log/backup.log` which contains some metadata and the outputs of `rsync`; the `-v` (verbose) flag is used to log the operations performed by `rsync`. The other flags, `-a` (archive) and `--delete`, preserve permissions and metadata, and delete files from the destination that are no longer present at the source, respectively. 

Before moving on to the next step (scheduling), I ran the script manually to get a baseline. 
### Step 2: Schedule with `crontab`
With the help of https://cron.help/, I devised the following `crontab`:

```bash
0 3 * * 1 /home/lab/backup.sh
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

| Previous   | Next |
| ---------- | ---- |
| [[part 6]] | null |
[^cron]: https://linux.die.net/man/8/cron
[^rsync]: https://linux.die.net/man/1/rsync