---
title: "picoCTF 2025: Bitlocker-1"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/Bitlocker-1/description.png]]
# Solution
I found this challenge (and it's sequel, [[Bitlocker-2]]) quite interesting since I'd previously not had any experience with Bitlocker or mounting Windows disks on Linux. After some research, I found it's not all that challenging!

Given the disk image, we can extract the bitlocker hashes using a tool such as [bitlocker2john](https://github.com/openwall/john/blob/bleeding-jumbo/run/bitlocker2john.py), which gives us hashes that look like:

```
$bitlocker$0$16$cb4809fe9628471a411f8380e0f668db$1048576$12$d04d9c58eed6da010a000000$60$68156e51e53f0a01c076a32ba2b2999afffce8530fbe5d84b4c19ac71f6c79375b87d40c2d871ed2b7b5559d71ba31b6779c6f41412fd6869442d66d
```

Hashcat has a profile for Bitlocker hashes: `22100`. We know that Jacky used a simple password, so let's use a dictionary attack with the RockYou wordlist. The command I used is as follows:

```bash
hashcat -m 22100 -a 0 bitlocker.hash /usr/share/wordlists/rockyou.txt
```

Quite quickly, we discover the password to be `jacqueline`! Knowing this information, we must now mount the virtual disk and find the flag. I found [dislocker](https://github.com/Aorimn/dislocker) to be a great fit for this. This is how I mounted the disk:

```bash
sudo mkdir /mnt/dislocker
sudo mkdir /mnt/decrypted
sudo dislocker bitlocker-1.dd -ujacqueline -- /mnt/dislocker
sudo mount -o loop /mnt/dislocker/dislocker-file /mnt/decrypted/
```

> [!note] 
> The lack of space between `-u` and the password is not a typo!

At this point, the disk is mounted, and we can `ls /mnt/decrypted` to  find `flag.txt`.
## Flag
`picoCTF{us3_b3tt3r_p4ssw0rd5_pl5!_3242adb1}`