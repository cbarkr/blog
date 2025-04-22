---
title: "picoCTF 2021: Mini RSA"
tags:
  - ctf
  - cryptography
date: 2025-01-28
---
# Problem
![[media/ctf/picoCTF/Mini RSA/description.png]]
# Solution
In my [[miniRSA|writeup]] for the 2019 edition of this question, I explained the bare necessities of RSA required to solve that problem. The same background is applicable here:

![[miniRSA#Background]]

But this plaintext has been padded! It's not quite textbook RSA! Therefore this shouldn't work!

This, however, is a simple padding scheme, so the same principles should apply given $m$ is only slightly wider than $n^{\frac{1}{e}}$[^so]. We may enumerate different amounts of padding until we find the correct amount. 
## Script
```python
from gmpy2 import iroot  
  
  
with open("ciphertext", "r") as f:  
	n, e, space, c = f.readlines()  
	n = int(n[3:])  
	e = int(e[3:])
	c = int(c[16:])  
  
  
for i in range(4096):
	# Pad by a multiple of `n`
	padded, is_exact = iroot(c + (i * n), e)  
	
	if is_exact and pow(padded, e, n) == c:
		print(padded.to_bytes(256, "big").decode("utf-8").strip("\x00").strip())
		break
```

[^so]: https://crypto.stackexchange.com/questions/6770/cracking-an-rsa-with-no-padding-and-very-small-e/6771#6771
