---
title: "picoCTF 2021: Mini RSa"
tags:
  - blog
  - ctf
date: 2025-01-28
---
# Problem
![[media/ctf/picoCTF/Mini RSA/description.png]]
# Solution
In my [[miniRSA|writeup]] for the 2019 edition of this question, I explained the bare necessities of RSA required to solve that problem. The same background is applicable here:

![[miniRSA#Background]]

But this plaintext has been padded - didn't I say the attack only applies to unpadded RSA? 
This is true for the most part, with the caveat of simple padding schemes (e.g. for $m$ slightly wider than $n^{\frac{1}{e}})$[^so]. Under such a padding scheme, we may enumerate different amounts of padding until we find the correct amount. 
## Script
```python
from gmpy2 import iroot  
  
  
with open("miniRSA2021ciphertext", "r") as f:  
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
## Flag
`picoCTF{e_sh0u1d_b3_lArg3r_60ef2420}`

[^so]: https://crypto.stackexchange.com/questions/6770/cracking-an-rsa-with-no-padding-and-very-small-e/6771#6771