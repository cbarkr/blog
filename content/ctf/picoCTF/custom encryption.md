---
title: "picoCTF 2024: custom encryption"
tags:
  - ctf
  - cryptography
date: 2025-01-09
---
# Problem
![[media/ctf/picoCTF/custom encryption/description.png]]
# Solution
We are given two files: `enc_flag` and `custom_encryption.py`. The former contains the flag as ciphertext as well as the parameters which were used to encrypt it, while the latter, as the name suggests, is the source code of the custom encryption algorithm used to encipher the flag. The contents of the files are as follows.
## Provided Files
### `enc_flag`
```
a = 94  
b = 29  
cipher is: [260307, 491691, 491691, 2487378, 2516301, 0, 1966764, 1879995, 1995687, 1214766, 0, 2400609, 607383, 144615, 1966764, 0, 636306, 2487378, 28923, 1793226, 694152, 780921, 173538, 173538, 491691, 173538, 751998, 1475073, 925536, 1417227, 751998, 202461, 347076, 491691]
```
### `custom_encryption.py`
```python
from random import randint  
import sys  
  
  
def generator(g, x, p):  
	return pow(g, x) % p  
  
  
def encrypt(plaintext, key):
	cipher = []  
	for char in plaintext:  
		cipher.append(((ord(char) * key*311)))  
	return cipher  
  
  
def is_prime(p):  
	v = 0  
	for i in range(2, p + 1):  
		if p % i == 0:  
			v = v + 1  
	if v > 1:  
		return False  
	else:  
		return True  
  
  
def dynamic_xor_encrypt(plaintext, text_key):  
	cipher_text = ""  
	key_length = len(text_key)  
	for i, char in enumerate(plaintext[::-1]):  
		key_char = text_key[i % key_length]  
		encrypted_char = chr(ord(char) ^ ord(key_char))  
		cipher_text += encrypted_char  
	return cipher_text  
  
  
def test(plain_text, text_key):  
	p = 97  
	g = 31  
	if not is_prime(p) and not is_prime(g):  
		print("Enter prime numbers")  
		return  
	a = randint(p-10, p)  
	b = randint(g-10, g)  
	print(f"a = {a}")  
	print(f"b = {b}")  
	u = generator(g, a, p)  
	v = generator(g, b, p)  
	key = generator(v, a, p)  
	b_key = generator(u, b, p)  
	shared_key = None  
	if key == b_key:  
		shared_key = key  
	else:  
		print("Invalid key")  
		return  
	semi_cipher = dynamic_xor_encrypt(plain_text, text_key)  
	cipher = encrypt(semi_cipher, shared_key)  
	print(f'cipher is: {cipher}')  
  
  
if __name__ == "__main__":  
	message = sys.argv[1]  
	test(message, "trudeau")
```
## Breakdown
Given these files, we (can) learn that
1. `text_key` (used in `dynamic_xor_encrypt`) is "trudeau"
2. `shared_key` (used in `encrypt`) can be leaked from `test`
3. The only sources of randomness, `a` and `b` in `test`, are provided in `enc_flag`
4. The encryption algorithm can be summarized as $c = (m \oplus key_{text} \times (key_{shared} \times 311))$
5. The decryption algorithm is therefore $m = (c \div (key_{shared} \times 311) \oplus key_{text})$
## `custom_decryption.py`
Based on the breakdown above, I adapted the provided encryption script to perform the decryption. As the parameters and ciphertext are static, I hardcoded them. The resulting script is provided in full below.

```python
from custom_encryption import is_prime, generator


def leak_shared_key(a, b):
    p = 97
    g = 31
    if not is_prime(p) and not is_prime(g):
        print("Enter prime numbers")
        return
    u = generator(g, a, p)
    v = generator(g, b, p)
    key = generator(v, a, p)
    b_key = generator(u, b, p)
    shared_key = None
    if key == b_key:
        shared_key = key
    else:
        print("Invalid key")
        return

    return shared_key


def decrypt(ciphertext, key):
    semi_ciphertext = []
    for num in ciphertext:
        semi_ciphertext.append(chr(round(num / (key * 311))))
    return "".join(semi_ciphertext)


def dynamic_xor_decrypt(semi_ciphertext, text_key):
    plaintext = ""
    key_length = len(text_key)
    for i, char in enumerate(semi_ciphertext):
        key_char = text_key[i % key_length]
        decrypted_char = chr(ord(char) ^ ord(key_char))
        plaintext += decrypted_char
    return plaintext[::-1]


if __name__ == "__main__":
    # 0. Take relevant values from `enc_flag` and `custom_encryption.py`
    a = 94
    b = 29
    ciphertext_arr = [
        260307,
        491691,
        491691,
        2487378,
        2516301,
        0,
        1966764,
        1879995,
        1995687,
        1214766,
        0,
        2400609,
        607383,
        144615,
        1966764,
        0,
        636306,
        2487378,
        28923,
        1793226,
        694152,
        780921,
        173538,
        173538,
        491691,
        173538,
        751998,
        1475073,
        925536,
        1417227,
        751998,
        202461,
        347076,
        491691,
    ]
    text_key = "trudeau"

    # 1. Get the shared key used in `test`
    shared_key = leak_shared_key(a, b)

    # 2. Invert the `encrypt` operation
    semi_ciphertext = decrypt(ciphertext_arr, shared_key)

    # 3. Invert the `dynamic_xor_encrypt` operation
    plaintext = dynamic_xor_decrypt(semi_ciphertext, text_key)

    # 4. Output the flag
    print(plaintext)
```
## Flag
`picoCTF{custom_d2cr0pt6d_751a22dc}`
