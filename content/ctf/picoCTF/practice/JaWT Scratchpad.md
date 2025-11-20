---
title: "picoCTF 2019: JaWT Scratchpad"
tags:
  - ctf
  - cryptography
date: 2025-11-19
---
# Problem
![[media/ctf/picoCTF/JaWT Scratchpad/description.png]]
# Solution
This was a pretty fun problem so I wanted to share it here. 

We start at the homepage of JaWT:

![[homepage.png]]

Taking a look around, one thing is immediately apparent: we want to log in as the admin. Another thing (which is less apparent) is that we will have to crack a hash to do so; I only noticed this when I hovered over the link for "John" and saw that it led to John the Ripper.

![[john_link.png]]

Attempting to log in as "admin" produces the following warning:

> **YOU CANNOT LOGIN AS THE ADMIN! HE IS SPECIAL AND YOU ARE NOT.**

My mummy says I'm special so I'll keep trying. Logging in as any other user is successful:

![[test_auth.png]]

When we do so, a cookie named "jwt" is set:

![[cookie.png]]

By plugging this cookie into https://jwt.io, we see that the algorithm is "HS256" (HMAC SHA256) and that the payload is `"user": "test"`:

![[decoded_jwt.png]]

Note, however, that the signature is incorrect. If we attempt to forge a token with the `"user": "admin"` claim without the correct signature, the server will reject it. Hence, we have to crack the secret.

To start, I pasted the token into a file:

![[jwt_txt_file.png]]

And found the appropriate mode in Hashcat (sorry John):

![[hashcat_jwt_mode.png]]

Then ran a dictionary attack with the `rockyou.txt` wordlist:

> [!NOTE]
> `--show` used as I already ran this while undertaking the challenge

![[hashcat_jwt_cracked.png]]

This spits out the secret `ilovepico`! Back to https://jwt.io, we can forge a token signed with this secret:

![[forged_token.png]]

Once we replace the value of the "jwt" cookie with this forged token and refresh the page, we will successfully authenticate as the admin user:

![[redacted_flag.png]]