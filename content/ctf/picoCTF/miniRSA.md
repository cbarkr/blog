---
title: "picoCTF 2019: miniRSA"
tags:
  - blog
  - ctf
date: 2025-01-28
---
# Problem
![[media/ctf/picoCTF/miniRSA/description.png]]
# Solution
Here we have some ciphertext encrypted using (presumably) textbook RSA. It is implied that a low public exponent *e* was used, which we can exploit to recover the flag. The solution is quite simple, but I'll first provide some background that will help makes sense of it. 
## Background
> [!note]
> The following only applies to unpadded (i.e. textbook) RSA

Textbook RSA is defined as follows: $c = RSA_{n, e}(m) \equiv m^e \pmod{n}$ where $n$ is the modulus, $e$ is the public key, and $m$ is the message. If $m^e \lt n$, then $c = m^e$ (i.e. the modulus doesn't work its magic) and $m$ can be recovered by computing the $e$th root of $c$ since $c^{\frac{1}{e}} =(m^e)^{\frac{1}{e}} = m$.

Computing such a value requires high-precision arithmetic since $c$ is a massive integer. The Python module `gmpy2` is great for such circumstances, providing the `iroot` for computing the $n$th root of an integer without sacrificing precision. 
## Script
```python
from gmpy2 import iroot  
  
  
with open("miniRSA2019ciphertext", "r") as f:  
	space1, n, e, space2, c = f.readlines()  
	n = int(n[3:])  
	e = int(e[3:])  
	c = int(c[16:])
  
  
m, is_exact = iroot(c, e)  
if is_exact and pow(m, e, n) == c:  
	print(m.to_bytes(256, "big").decode("utf-8").strip("\x00").strip())
```
## Flag
`picoCTF{n33d_a_lArg3r_e_606ce004}`