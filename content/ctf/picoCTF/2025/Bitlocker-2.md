---
title: "picoCTF 2025: Bitlocker-2"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/Bitlocker-2/description.png]]
# Solution
In this challenge, we're given both a disk image and a memory dump, perhaps obtained via a [cold boot attack](https://en.m.wikipedia.org/wiki/Cold_boot_attack). I discovered 2 solutions - the first is quick and dirty (and most certainly not the intended solution), while the second is perhaps more conventional. 
## Solution 1
The flag is in memory, and can thus be retrieved by running:

```bash
cat memdump.mem | grep 'picoCTF{' --text
```
## Solution 2
I started by getting some information about the memory dump using Volatility 3 by running `vol -f memdump.mem windows.info`. This tells us the system is running Windows 10 x64 on build 10.0.19041. This will be relevant for later.

I then searched for "bitlocker" and "flag" in the memory dump's strings: 

```bash
strings -el memdump.mem | grep -iE 'bitlocker|flag'
```

From this, we can discover 2 relevant text files:
1. `BitLocker Recovery Key 2AE26DD3-87AE-4A0F-A380-9848FF6E866D.TXT`
2. `flag.txt`

If these files were cached, we could find their offset in the cache using `filescan`, then dump the data using `dumpfiles`[^dumpcache]. Unfortunately, I couldn't find any way to do this with Volatility 3, so I had to use Volatility 2. The latter, however, refused to work on my machine, so I instead setup a [REMnux](https://remnux.org/) VM (which has both Volatility 2 and 3 pre-installed) before continuing.

To read files this way:
1. Find the offset: `vol.py -f memdump.mem --profile=Win10x64_19041 filescan | grep -E -i -w <filename>` 
2. Dump the data at that offset:`vol.py -f memdump.mem --profile=Win10x64_19041 dumpfiles <offset> -D ./dumps`

Neither file was cached, hence this failed, but I include it as it might be useful in other situations. 

At this point, I focused on Bitlocker plugins for Volatility 2. The REMnux VM comes pre-installed with *a* Bitlocker plugin, but despite extracting a few keys, none of them did the trick. I then tried [this](https://github.com/breppo/Volatility-BitLocker) plugin, which did! This plugin also has an option to outputs the key as a FVEK for `dislocker`. I ran it like so:

```bash
python2 vol.py -f ../memdump.mem --profile=Win10x64_19041 bitlocker --dislocker ../dumps
```

This produced the file `dumps/0x8087865bead0-Dislocker.fvek` (among others, but this was the winner). 

The rest is similar to [[Bitlocker-1]] with two small exceptions:

1. Since we're not providing a user password, but instead a FVEK file, we must use the `-V` and `-k` flags to specify the image and key file, respectively
2. The image wouldn't mount as a normal loop device, so I used `ntfs-3g`[^ntfs-3g] instead

```bash
sudo mkdir /mnt/dislocker
sudo mkdir /mnt/decrypted
sudo dislocker -Vbitlocker-1.dd -kdumps/0x8087865bead0-Dislocker.fvek -- /mnt/dislocker
sudo mount -t ntfs-3g /mnt/dislocker/dislocker-file /mnt/decrypted
```

Just as before, when we `ls /mnt/decrypted`, we  find `flag.txt`.
## Flag
`picoCTF{B1tl0ck3r_dr1v3_d3crypt3d_9029ae5b}`

[^dumpcache]: https://github.com/volatilityfoundation/volatility/issues/704
[^ntfs-3g]: https://askubuntu.com/a/501035