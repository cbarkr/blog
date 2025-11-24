---
title: "picoCTF 2021: Mind your Ps and Qs"
tags:
  - ctf
  - cryptography
date: 2025-11-23
---
# Problem
![[media/ctf/picoCTF/Mind your Ps and Qs/description.png]]
# Solution
See [[rsa]] for a refresher on the Ps and Qs. `values` contains everything else:

```
Decrypt my super sick RSA:
c: 843044897663847841476319711639772861390329326681532977209935413827620909782846667
n: 1422450808944701344261903748621562998784243662042303391362692043823716783771691667
e: 65537
```

As we saw with [[john_pollard]], a small `N` can be factored (using an algorithm such as [Pollard's rho algorithm](https://en.wikipedia.org/wiki/Pollard's_rho_algorithm)). I first attempted to write my own brutish factorization using [gmpy2](https://pypi.org/project/gmpy2/), then implemented and ran Pollard's rho algorithm (referencing [this](https://github.com/TheAlgorithms/Python/blob/master/maths/pollard_rho.py)), before finally realizing that I could speed up the process with [FactorDB](https://factordb.com/index.php?query=1422450808944701344261903748621562998784243662042303391362692043823716783771691667). 

With `p` and `q` in hand (thank you FactorDB), decrypting the message is simple:
## Script
```python
with open("values", "r") as f:
	_, c, n, e = f.readlines()
	c = int(c[3:])
	n = int(n[3:])
	e = int(e[3:])

# n factored using FactorDB
# See https://factordb.com/index.php?query=1422450808944701344261903748621562998784243662042303391362692043823716783771691667
p = 2159947535959146091116171018558446546179
q = 658558036833541874645521278345168572231473

phi = (p-1) * (q-1)
d = pow(e, -1, phi)

m = pow(c, d, n)
m_bytes = bytes.fromhex(hex(m)[2:])
m_str = m_bytes.decode("utf-8")

print(m_str)
```
