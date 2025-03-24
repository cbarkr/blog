---
title: "picoCTF 2025: ChaChaSlide"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/ChaCha Slide/description.png]]
# Solution
After launching our challenge instance, we're given the following source code:

```python
import secrets  
import hashlib  
from Crypto.Cipher import ChaCha20_Poly1305  
  
flag = open("flag.txt").read().strip()  
  
def shasum(x):  
   return hashlib.sha256(x).digest()  
  
key = shasum(shasum(secrets.token_bytes(32) + flag.encode()))  
  
# Generate a random nonce to be extra safe  
nonce = secrets.token_bytes(12)  
  
messages = [  
   "Did you know that ChaCha20-Poly1305 is an authenticated encryption algorithm  
?",  
   "That means it protects both the confidentiality and integrity of data!"  
]  
  
goal = "But it's only secure if used correctly!"  
  
def encrypt(message):  
   cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)  
   ciphertext, tag = cipher.encrypt_and_digest(message)  
   return ciphertext + tag + nonce  
  
def decrypt(message_enc):  
   ciphertext = message_enc[:-28]  
   tag = message_enc[-28:-12]  
   nonce = message_enc[-12:]  
   cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)  
   plaintext = cipher.decrypt_and_verify(ciphertext, tag)  
   return plaintext  
  
for message in messages:  
   print("Plaintext: " + repr(message))  
   message = message.encode()  
   print("Plaintext (hex): " + message.hex())  
   ciphertext = encrypt(message)  
   print("Ciphertext (hex): " + ciphertext.hex())  
   print()  
   print()  
  
user = bytes.fromhex(input("What is your message? "))  
user_message = decrypt(user)  
print("User message (decrypted): " + repr(user_message))  
  
if goal in repr(user_message):  
   print(flag)
```
## Background
ChaCha20-Poly1305 is an authenticated encryption algorithm which combines the ChaCha20 stream cipher with the Poly1305 [MAC](https://en.wikipedia.org/wiki/Message_authentication_code). The security for ChaCha20-Poly1305 relies on choosing a unique nonce for every message encrypted[^wiki], but note that in the above code, *both messages are encrypted using the same key and nonce*. And according to the RFC[^rfc4]:

```
If a nonce is repeated, then both the one-time Poly1305 key and the keystream are identical between the messages. This reveals the XOR of the plaintexts, because the XOR of the plaintexts is equal to the XOR of the ciphertexts.
```

Not only can the XOR of the plaintexts be revealed, but an attacker can also forge new messages using the same nonce[^se]. This is what we want to achieve. 

But in order to do so, we'll have to first take a look at the algorithm itself[^wikidiagram]:

![[diagram.png]]

Since the key $K$ and nonce $N$ are reused, the one-time key $(r,s)$ produced by `Poly1305_Key_Gen` and the keystream $ks$ produced by `ChaCha20` will be identical between ciphertexts. 

$C = M \oplus ks$, so if we have $C_1, C_2$ both encrypted by the same $ks$, then $C_1 \oplus C_2 = (M_1 \oplus ks) \oplus (M_2 \oplus ks) = M_1 \oplus M_2$. But since, in this case, we know both $M_1$ and $M_2$), we can recover $ks$ (e.g. by computing $ks = M_1 \oplus C_1$) and subsequently forge a new $C_3 = M_3 \oplus ks$.

As for the authentication tag $T$, there is no associated data (AD) here, so the input to Poly1305 is simply:

```
| C | pad(C) | len(C) |
```

From the pairs $(T_1, C_1), (T_2, C_2)$ the one-time key $(r,s)$ can be recovered by finding the roots of the polynomial[^rfc2.5].

With both $ks$ and $(r,s)$ in hand, a new $M_3$ can be used to produce a valid $T_3$ and $C_3$ by running Poly1305 on `C | pad(C) | len(C)` with $(r,s)$ and computing $M_3 \oplus ks$, respectively. 
## Script
In researching this problem, I came across the repository [AEAD-Nonce-Reuse-Attacks](https://github.com/tl2cents/AEAD-Nonce-Reuse-Atta) by [tl2cents](https://github.com/tl2cents) which implements this kind of message forgery already. I used [`chacha_poly1305_forgery.py`](https://github.com/tl2cents/AEAD-Nonce-Reuse-Attacks/blob/main/chacha-poly1305/chacha_poly1305_forgery.py) in my solution, so full credit goes to the original author!

Now all that was left was to plug in the values that we observed in running the original source code. 

```python
m1 = b"Did you know that ChaCha20-Poly1305 is an authenticated encryption algorithm?"  
e1 = bytes.fromhex("028dae4777beee769d7e37cf5bf8081fcaecaa21ec9a4daedc59d5e7410dd985f1f9ca1a5caa6d611f5a493d3af057d59ef73c9888325f915aa8bc786f2d00a54b850382c694638aef524f1c328a79eef0b7497d71eb810949906e94f5511ba9de0a2aa48358a266ed")  
c1 = e1[:-28]  
t1 = e1[-28:-12]  
n1 = e1[-12:]  
ad1 = b""  
  
m2 = b"That means it protects both the confidentiality and integrity of data!"  
e2 = bytes.fromhex("128cab132ebcfe37986378d10fac100cd1b88c2af9aa05ad811d90975a09c594a1a6915c5cbd286e0513492427ec4b9b8bf03bd995394fd458b4b67e6f7d1baa048f4297cbd220f8985b1461025143e6800a2c0ee8db511ba9de0a2aa48358a266ed")  
c2 = e2[:-28]  
t2 = e2[-28:-12]  
n2 = e2[-12:]  
ad2 = b""  
  
assert n1 == n2  
  
m3 = b"But it's only secure if used correctly!"  
ad3 = b""  

# CREDIT: https://github.com/tl2cents/AEAD-Nonce-Reuse-Attacks/blob/main/chacha-poly1305/chacha_poly1305_forgery.py
from chacha_poly1305_forgery import chachapoly1305_forgery_attack  
  
res = chachapoly1305_forgery_attack(  
       ad1,  
       c1,  
       t1,  
       ad2,  
       c2,  
       t2,  
       m1,  
       m3,  
       ad3  
)  
  
for i in res:  
       c3, t3 = i  
  
       print(c3.hex() + t3.hex() + n1.hex())
```
## Flag
`picoCTF{7urn_17_84ck_n0w_de83e62c}`

[^wiki]: https://en.wikipedia.org/wiki/ChaCha20-Poly1305#Security
[^wikidiagram]: https://en.wikipedia.org/wiki/ChaCha20-Poly1305#/media/File:ChaCha20-Poly1305_Encryption.svg
[^rfc4]: https://datatracker.ietf.org/doc/html/rfc7539#section-4
[^rfc2.5]: https://datatracker.ietf.org/doc/html/rfc7539#section-2.5
[^se]: https://crypto.stackexchange.com/a/32116