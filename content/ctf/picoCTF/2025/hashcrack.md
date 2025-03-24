---
title: "picoCTF 2025: hashcrack"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/hashcrack/description.png]]
# Solution
Upon connecting to this endpoint, we're given a series of hashes which we must identify and crack. I like cats so Hashcat is my top choice :)
## Hash 1
```
482c811da5d5b4bc6d497ffa98491e38
```

This first hash is 32 hexadecimal characters, which is 128 bits. The most popular 128-bit hash is MD5 (mode `0` in Hashcat), so let's run it with the RockYou dataset:

```bash
hashcat -m 0 -a 0 ciphertext1 /usr/share/wordlists/rockyou.txt
```

Within moments, we find `482c811da5d5b4bc6d497ffa98491e38:password123`. Entering `password123` into the oracle takes us to the next hash.
## Hash 2
```
b7a875fc1ea228b9061041b7cec4bd3c52ab3ce3
```

This next hash is 40 hexadecimal characters, or 192 bits. Very few hashes are of this length, SHA-1 (mode `100`) being one of the most popular, so let's try that:

```bash
hashcat -m 100 -a 0 ciphertext2 /usr/share/wordlists/rockyou.txt
```

Once again, the hash is cracked in moments: `b7a875fc1ea228b9061041b7cec4bd3c52ab3ce3:letmein`. Inputting `letmein` leads us to the final hash.
## Hash 3
```
916e8c4f79b25028c9e467f1eb8eee6d6bbdff965f9928310ad30a8d88697745
```

The final hash is 64 characters, or 256 bits. SHA-256 (mode `1400`) is the most common. Once again:

```bash
hashcat -m 1400 -a 0 ciphertext3 /usr/share/wordlists/rockyou.txt
```

And similarly, we find `916e8c4f79b25028c9e467f1eb8eee6d6bbdff965f9928310ad30a8d88697745:qwerty098`. After submitting `qwerty098`, we are given the flag.
## Flag
`picoCTF{UseStr0nG_h@shEs_&PaSswDs!_70ffa57c}`