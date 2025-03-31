---
title: "Swamp CTF 2025: Rock my Password"
tags:
  - ctf
  - cryptography
date: 2025-03-30
---
# Problem
![[media/ctf/SwampCTF/Rock my Password/description.png]]
# Solution
> [!quote]
> There's no way you're going to be able to **undo** it >:3

That's right! We cannot *undo* the hashing, but we can recompute it. The authors give us everything we need to quickly crack the password:

1. The flag is hashed with MD5 100x, then SHA-256 100x, then SHA-512 100x
2. The password is in RockYou and is 10 characters long
3. The entire flag is hashed, not just the password

I started by putting the hashed password into a file named `enc_flag`. I then wrote a Python script which filters the RockYou wordlist by length (i.e. leaving only passwords of length 10), then computes the hash as described until the given tag is found. This script is as follows:

```python
from hashlib import md5, sha256, sha512  
  
# 1. Given the flag is from RockYou  
with open("/usr/share/wordlists/rockyou.txt", "rb") as f:  
       ry = f.read().splitlines()  
  
# 2. Given that flag is 10 characters  
shortlist = [i for i in ry if len(i) == 10]  
  
with open("enc_flag", "r") as f:  
       c = f.read().strip()  
  
c_bytes = bytes.fromhex(c)  
  
for guess in shortlist:  
       # 3. Given that guess is hashed with the `swampCTF{}` text  
       hashed_guess = b"swampCTF{" + guess.strip() + b"}"  
  
       # 4. Given that the flag is hashed 100x with MD5  
       for i in range(100):  
               hashed_guess = md5(hashed_guess).digest()  
  
       # 5. Then 100x with SHA256  
       for i in range(100):  
               hashed_guess = sha256(hashed_guess).digest()  
  
       # 6. Then 100x with SHA512  
       for i in range(100):  
               hashed_guess = sha512(hashed_guess).digest()  
  
       if hashed_guess == c_bytes:  
               break  
  
print(b"swampCTF{" + guess + b"}")
```