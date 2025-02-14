---
title: "LA CTF 2025: RSAaaS"
tags:
  - ctf
  - cryptography
date: 2025-02-13
---
# Problem
![[media/ctf/LA CTF/RSAaaS/description.png]]
# Solution
> [!note]
> I solved this after LA CTF 2025 closed

Let's start by taking a look at `chall.py`:

```python
from Crypto.Util.number import isPrime  
  
  
def RSAaaS():  
	try:  
		print("Welcome to my RSA as a Service! ")  
		print("Pass me two primes and I'll do the rest for you. ")  
		print("Let's keep the primes at a 64 bit size, please. ")  
		
		while True:  
			p = input("Input p: ")  
			q = input("Input q: ")  
			try:  
				p = int(p)  
				q = int(q)  
				assert isPrime(p)  
				assert isPrime(q)  
			except:  
				print("Hm, looks like something's wrong with the primes you sent. ")  
				print("Please try again. ")  
				continue  
			
			try:  
				assert p != q  
			except:  
				print("You should probably make your primes different. ")  
				continue  
			
			try:  
				assert (p > 2**63) and (p < 2**64)  
				assert (q > 2**63) and (q < 2**64)  
				break  
			except:  
				print("Please keep your primes in the requested size range. ")  
				print("Please try again. ")  
				continue  
		
		n = p * q  
		phi = (p - 1) * (q - 1)  
		e = 65537  
		d = pow(e, -1, phi)  
		
		print("Alright! RSA is all set! ")  
		while True:  
			print("1. Encrypt 2. Decrypt 3. Exit ")  
			choice = input("Pick an option: ")  
			
			if choice == "1":  
				msg = input("Input a message (as an int): ")  
				try:  
					msg = int(msg)  
				except:  
					print("Hm, looks like something's wrong with your message. ")  
					continue  
				encrypted = pow(msg, e, n)  
				print("Here's your ciphertext! ")  
				print(encrypted)  
			
			elif choice == "2":  
				ct = input("Input a ciphertext (as an int): ")  
				try:  
					ct = int(ct)  
				except:  
					print("Hm, looks like something's wrong with your message. ")  
					continue  
				decrypted = pow(ct, d, n)  
				print("Here's your plaintext! ")  
				print(decrypted)  
			
			else:  
				print("Thanks for using my service! ")  
				print("Buh bye! ")  
				break  
	
	except Exception:  
		print("Oh no! My service! Please don't give us a bad review! ")  
		print("Here, have a complementary flag for your troubles. ")  
		with open("flag.txt", "r") as f:  
			print(f.read())  


RSAaaS()
```

The objective therefore seems to be the exploitation of `RSAaaS` such that our inputs raise an `Exception` that is uncaught by any of the inner-level `except` blocks. 

What do we have control over?
1. `p` and `q`
2. `choice`
3. `msg`

Which code do we have control over that is not wrapped in a try-except block?
1. `input(...)`
2. `pow(...)`

Since this is a #cryptography challenge, I assume it has to be something related to `pow`. A quick `cat chall.py | grep pow` shows us the 3 instances it is used:

![[grep_pow.png]]

The first instance seems like a good place to start. 

$\forall a \mod N, \space\text{if}\space \exists a^{-1}: a^{-1} \mod N \leftrightarrow gcd(a, N) = 1$, so for `e` to be invertible (i.e. to compute `d`), $gcd(e, \varphi(n)) = 1$ must hold. `pow` will raise an exception otherwise. So we need to find a $\varphi(n)$ such that $\gcd(e, \varphi(n)) \neq 1$. Since $\varphi(n) = (p-1) \times (q-1)$, this is equivalent to finding some $p$ such that $\gcd(e, p-1) \neq 1$. The following script finds such `p` and `q` :

```python
from Crypto.Util.number import getPrime  
from gmpy2 import gcd, next_prime  
  
p = pow(2, 63)  
while gcd(65537, p-1) == 1:  
	p = next_prime(p)  
  
print(f"p = {p}")  
print(f"q = {getPrime(64)}")
```

In my testing, this spat out the following numbers:

```bash
p = 9223372036859527241  
q = 13282730547056735131
```

Plugging these into `chall.py` (running locally), we find:

![[base_not_invertible.png]]

Bingo! And on the deployed RSAaaS:

![[media/ctf/LA CTF/RSAaaS/flag.png]]
## Flag
`lactf{actually_though_whens_the_last_time_someone_checked_for_that}`