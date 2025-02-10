---
title: "LA CTF 2025: Extremely Convenient Breaker"
tags:
  - blog
  - ctf
  - cryptography
date: 2025-02-09
---
# Problem
![[media/ctf/LA CTF/Extremely Convenient Breaker/description.png]]
# Solution
Let's start by taking a look at `chall.py`:

```python
from Crypto.Cipher import AES  
import os  

key = os.urandom(16)  
with open("flag.txt", "r") as f:  
	flag = f.readline().strip()  
cipher = AES.new(key, AES.MODE_ECB)  

flag_enc = cipher.encrypt(flag.encode())  
print("Here's the encrypted flag in hex: ")  
print(flag_enc.hex())  
print("Alright, lemme spin up my Extremely Convenient Breaker (trademark copyright all rights reserved). ")  

while True:  
	ecb = input("What ciphertext do you want me to break in an extremely convenient manner? Enter as hex: ")  
	try:  
		ecb = bytes.fromhex(ecb)  
		if not len(ecb) == 64:  
			print("Sorry, it's not *that* convenient. Make your ciphertext 64 bytes please. ")  
		elif ecb == flag_enc:  
			print("No, I'm not decrypting the flag. ")  
		else:  
			print(cipher.decrypt(ecb))  
	except Exception:  
		print("Uh something went wrong, please try again. ")
```

What do we learn from this? 
- The flag is encrypted with AES in ECB mode
- The key is 16 bytes
- The ciphertext is 64 bytes

Running the oracle, we see the following (minus the redacted section):

![[oracle1.png]]

Passing in the encrypted flag (in its entirety) is out of the question:

![[oracle2.png]]

However, the flag can be decrypted in parts, given this is ECB-mode AES.
## Background
Electronic CodeBook (ECB) mode AES encrypts messages $m$ in blocks $m_i$ using a function $f$ keyed on key $k$ (herein notated as $f_k$). Each ciphertext block $c_i$ is thus computed like: $c_i = f_k(m_i)$. After all blocks have been encrypted, all $c_i$'s are concatenated to construct the resulting ciphertext $c$.

![[Drawing 2025-02-09 20.02.29.excalidraw]]
## Back to the show
So now that we know how ECB mode works, we know that we can simply decrypt each block the join the resulting plaintext. Let's do that!
### Block 1
To retrieve the first block, I altered the last value (i.e. `f` -> `e`) then decrypted the resulting string. This, of course, corrupts the final block, but since ECB encrypts each block independently, the first block is preserved.  

![[oracle3.png]]
### Block 2
The same goes for the second block, but the other way around.

![[oracle4.png]]
## Flag
`lactf{seems_it_was_extremely_convenient_to_get_the_flag_too_heh}`