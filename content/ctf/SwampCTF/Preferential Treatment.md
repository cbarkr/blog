---
title: "Swamp CTF 2025: Preferential Treatment"
tags:
  - ctf
date: 2025-03-30
---
# Problem
![[media/ctf/SwampCTF/Preferential Treatment/description.png]]
# Solution
Sifting through the PCAP by hand, I noticed a packet which contained XML as data:

![[media/ctf/SwampCTF/Preferential Treatment/pcap.png]]

Copy-pasting the hex into [Cyberchef](https://cyberchef.org/) for readability, I noticed a base64-encoded `cpassword` field, as highlighted below:

![[decoded.png]]

Decoding `cpassword` from base64 didn't yield any readable text, so I did some quick research. I discovered this [post](https://pentestlab.blog/tag/cpassword/), which informs me this XML is associated with Group Policy Preferences and that `cpassword` is encrypted using AES. This might have been a problem, had it not been for the fact that Microsoft has [published the key](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-gppref/2c15cbf0-f086-4c74-8b70-1f2fa45dd4be?redirectedfrom=MSDN). 

With this information, we can now decrypt the `cpassword`! I wrote the following script to do so:

```python
import base64
from Crypto.Cipher import AES

# REF: https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-gppref/2c15cbf0-f086-4c74-8b70-1f2fa45dd4be?redirectedfrom=MSDN
key_hex = "4e9906e8fcb66cc9faf49310620ffee8f496e806cc057990209b09a433b66c1b"
key_bytes = bytes.fromhex(key_hex)

cpassword_b64 = "dAw7VQvfj9rs53A8t4PudTVf85Ca5cmC1Xjx6TpI/cS8WD4D8DXbKiWIZslihdJw3Rf+ijboX7FgLW7pF0K6x7dfhQ8gxLq34ENGjN8eTOI="
cpassword_decoded = base64.b64decode(cpassword_b64)

cipher = AES.new(key_bytes, AES.MODE_CBC)
flag = cipher.decrypt(cpassword_decoded)

print(flag.decode("utf-8", errors="ignore"))
```