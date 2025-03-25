---
title: "picoCTF 2025: EVEN RSA CAN BE BROKEN???"
tags:
  - ctf
  - cryptography
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/EVEN RSA CAN BE BROKEN???/description.png]]
# Solution
The program's source code is as follows:

```python
from Crypto.Util.number import bytes_to_long, inverse  
from setup import get_primes  
  
e = 65537  
  
def gen_key(k):  
   """  
   Generates RSA key with k bits  
   """  
   p,q = get_primes(k//2)  
   N = p*q  
   d = inverse(e, (p-1)*(q-1))  
  
   return ((N,e), d)  
  
def encrypt(pubkey, m):  
   N,e = pubkey  
   return pow(bytes_to_long(m.encode('utf-8')), e, N)  
  
def main(flag):  
   pubkey, _privkey = gen_key(1024)  
   encrypted = encrypt(pubkey, flag)    
   return (pubkey[0], encrypted)  
  
if __name__ == "__main__":  
   flag = open('flag.txt', 'r').read()  
   flag = flag.strip()  
   N, cypher  = main(flag)  
   print("N:", N)  
   print("e:", e)  
   print("cyphertext:", cypher)  
   exit()
```

Nothing particularly stands out here, except perhaps this custom `get_primes` function. If we compare $n$ across multiple requests, we learn that they share a factor! Factoring $n = pq$ given $n$ is hard, but if $n_1$ and $n_2$ share a factor, then factoring $n_1$ and $n_2$ is easy since $\gcd(n_1, n_2) = p_1$ and $q_1 = \lfloor\frac{n_1}{p_1}\rfloor$ (likewise for $p_2, q_2$). With $p$ and $q$, we can compute $d$, and therefore decrypt the flag.
## Script
```python
from pwn import *  
from gmpy2 import gcd, invert  
  
  
def main():  
       e = 65537  
       items = []  
  
       for i in range(2):  
               conn = remote("verbal-sleep.picoctf.net", 53723)  
               n = conn.recvline()  
               conn.recvline()  
               c = conn.recvline()  
  
               n = int(n[2:])  
               c = int(c[12:])  
  
               items.append((n, c))  
  
               conn.close()  
  
       (n1, c1), (n2, c2) = items  
  
       p1 = gcd(n1, n2)  
  
       if p1 != 1:  
               q1 = n1 // p1  
               phi1 = (p1-1) * (q1-1)  
               d1 = invert(e, phi1)  
               m1 = pow(c1, d1, n1)  
  
               m1_bytes = bytes.fromhex(hex(m1)[2:])  
               m1_str = m1_bytes.decode("utf-8")  
  
               print(m1_str)  
  
  
if __name__ == "__main__":  
       main()
```