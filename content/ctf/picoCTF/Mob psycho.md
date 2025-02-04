---
title: "picoCTF 2024: Mob psycho"
tags:
  - blog
  - ctf
date: 2025-02-03
---
# Problem
![[media/ctf/picoCTF/Mob psycho/description.png]]
# Solution
I'm taking a course on mobile security at the moment so I've been interested in trying out some Android CTFs - and as a Mob Psycho fan, this problem jumped out at me immediately.
## Step 1: Unpack APK
APKs are basically just `zip` files under the hood, and can thus be unpacked as one. There are a few methods to do so. For example,
1. `unzip mobpsycho.apk`
2. `apktool d mobpsycho.apk`
3. `binwalk -e mobpsycho.apk`
## Step 2: Find The Flag
This is where the `Forensics` tag comes into play, testing one's `find`-ing and `grep`-ing abilities. I first tried searching by content (i.e. `picoCTF`) using `egrep . -r -e picoCTF`, but this yielded no results. A search for `txt` files using `find . -name *.txt` yielded a single result: `res/color/flag.txt` - this seems promising!
## Step 3: Convert The Flag
`res/color/flag.txt` contains a hex string which seems a likely candidate for the flag. To confirm (and since we need the flag in ASCII), a conversion is in order. Either toss the string in CyberChef or open up a Python terminal like so:

![[hex2ascii.png]]
## Flag
`picoCTF{ax8mC0RU6ve_NX85l4ax8mCl_703dd9ef}`