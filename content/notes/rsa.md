---
title: RSA
tags:
  - notes
  - cryptography
date: 2025-04-21
---
# Background
## Coprime
> Integers $a$ and $b$ are said to be coprime if $gcd(a, b) = 1$
## Fermat’s Little Theorem
> Suppose $p$ is prime and $a$ is any integer
> 
> Then $a^p \equiv a \pmod{p}$
## Euler's Totient Function
> Let $\varphi(n)$ equal the number of positive integers less than n that are coprime to n
> 
> Suppose $n = pq$ for some primes $p$ and $q$
> 
> Then $\varphi(n) = \varphi(pq) = (p-1)(q-1)$
## Euler’s Theorem
> Suppose $a$ and $n$ are coprime positive integers
> 
> Then $a^{\varphi(n)} \equiv 1 \pmod{n}$
# Textbook Definition
Suppose two parties, Alice and Bob, wish to communicate securely. Bob wants to send an encrypted message to Alice without exchanging a shared private key.
## 1. Key Generation
1. Alice and Bob agree on suitable parameters (i.e. size of the modulus and public exponent)
2. Alice chooses two distinct and large primes, $p$ and $q$, with a large difference between the two
3. She compute the *modulus* $n = pq$
4. She then computes Euler's totient function, $\varphi(n) = (p-1)(q-1)$
5. With public exponent $e$ such that $gcd(e, \varphi(n)) = 1$, Alice publishes the pair $(n, e)$
## 2. Encryption
1. Bob encrypts message $m$ into ciphertext $c$ like so: $c = m^e \pmod{n}$
2. Bob sends $c$ to Alice
## 3. Decryption
1. Alice computes the private key, $d$, as $d = e^{-1} \pmod{\varphi(n)}$
	1. By the difficulty of integer factorization, Alice is the only one who knows $\varphi(n)$ and is therefore the only one who can compute $d$
2. She then computes $m = c^d \pmod{n}$ to recover Bob's message
# Attacks on Textbook RSA
## 1. Small Public Exponent
For small $e$, the plaintext is trivially recovered by computing the $e$th root of $c$ like as $c^{\frac{1}{e}} = (m^e)^{\frac{1}{e}} = m$.
## 2. Small Modulo
If $n$ is small, $p$ and $q$ may computed relatively quickly using an algorithm such as [Pollard's rho algorithm](https://en.wikipedia.org/wiki/Pollard%27s_rho_algorithm).
## 3. Precomputed Modulo
If $pq = n$ is precomputed and stored in a database such as [FactorDB](https://factordb.com/), $p$ and $q$ (and therefore $d$) may be recovered from $n$ by simply querying such a database.
## 4. Non-Coprime Moduli
If the same message $m$ is encrypted twice as $c_1 = m^e \pmod{n_1}$ and $c_2 = m^e \pmod{n_2}$ where $gcd(n_1, n_2) \neq 1$, then either $n_1$ or $n_2$ can be factored easily by computing $p = gcd(n_1, n_2)$ and $q = \lfloor \frac{n_1}{p} \rfloor$. $m$ can be recovered by recomputing $d$ given $p$ and $q$.
## 5. Håstad's Broadcast
If the same message $m$ is encrypted using the same $e$ but a different modulus $n_i \in \set{n_1, \dots, n_k}$, $e$ ciphertexts are needed to recover $m$.

Suppose an eavesdropper Eve intercepts $\set{c_1, \dots, c_e}$ where each $c_i \equiv m^e \pmod{n_i}$. By the [Chinese Remainder Thereom](https://en.wikipedia.org/wiki/Chinese_remainder_theorem) (CRT), Eve may compute $c \equiv c_i \pmod{n_i}$, followed by $c \equiv m^e \pmod{n_1 \dots n_k}$. However, since $m \lt n_i \forall i$, then $c = m^e$. $m$ can thus be recovered in the same manner as the low public exponent attack.
## 6. Common Modulus
If the same message $m$ is encrypted using a different $e$ but the same modulus $n$, only 2 ciphertexts are needed to recover $m$ if (1) $gcd(e_1, e_2) = 1$, and (2) $gcd(c_2, n) = 1$.

Suppose an eavesdropper Eve intercepts $c_1, c_2$ where $c_1 = m^{e_1} \pmod{n}$ and $c_2 = m^{e_2} \pmod{n}$, and knows each $(n, e_1)$ and $(n, e_2)$ since they are public information.

First, by [Bézout’s identity](https://en.wikipedia.org/wiki/B%C3%A9zout%27s_identity), Eve knows there exist integers $x$ and $y$ such that $e_1x + e_2y = 1$. She solves for $x$ and $y$ using the [Extended Euclidean algorithm](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm):
1. Solving for $x$: Let $y = 1$ and invert $e_1$ under $\mod{e_2}$
	1. $e_1x + e_2y = e_1x + e_2 = 1$
	2. Since $gcd(e1, e2) = 1$, $x = e_1^{-1} \pmod{e_2}$
2. Solve for $y$: Since $e_1$ and $e_2$ are known, reorder
	1. $e_1x + e_2y = 1 \leftrightarrow y = \frac{1-e_1x}{e_2}$

Second, given $x$ and $y$, she recovers $m$ like so: 
1. $c_1^x \cdot c_2^y \mod{n} = (m^{e_1})^x \cdot (m^{e_2})^y$
2. $(m^{e_1})^x \cdot (m^{e_2})^y = m^{e_1x} \cdot m^{e_2y} \mod{n}$
3. $m^{e_1x} \cdot m^{e_2y} \mod{n} = m^{e_1x + e_2y} \mod{n}$
4. $m^{e_1x + e_2y} \mod{n} = m^1 \mod{n}$ (by Bézout’s identity)
5. $m^1 \mod{n} = m \mod{n}$

However, as $y$ will be negative (given $e_1x \gt 1$ and $y$'s numerator computes $1-e_1x$), it will have to be applied to $c_2$'s inverse, $c_2^{-1}$.

Thus, to recover $m$, Eve computes $c_1^x \cdot (c_2^{-1})^y \mod{n}$ using public information.
## 7. Chosen Ciphertext Attack
Let $Enc(m)$ denote $c = m^e \pmod{n}$ for illustrative purposes. 

RSA is partially-homomorphic: for two messages $m_1$ and $m_2$,
1. $Enc(m_1) \cdot Enc(m_2) = m_1^e \pmod{n} \cdot m_2^{e} \pmod{n}$
2. $m_1^e \pmod{n} \cdot m_2^{e} \pmod{n} = m_1^e \cdot m_2^{e} \pmod{n}$
3. $m_1^e \cdot m_2^{e} \pmod{n} = (m_1 \cdot m_2)^e \pmod{n}$
4. $(m_1 \cdot m_2)^e \pmod{n} = Enc(m_1 \cdot m_2)$

So, the product of two ciphertexts is equal to the encryption of the product of the respective plaintexts. 

Suppose an attacker is given a ciphertext, $c = m^e \pmod{n}$ and a decryption oracle that will decrypt anything except $c$. If the attacker were to supply $c' = c \cdot k$ for some arbitrary integer $k$ to the oracle, it would happily decrypt $c'$ since $c' \neq c$. However, since the attacker chose $k$, they can recover $m$ by simply computing $m = \frac{c'}{k}$.