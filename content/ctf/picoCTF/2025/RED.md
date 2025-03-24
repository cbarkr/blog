---
title: "picoCTF 2025: RED"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/RED/description.png]]
# Solution
![[red.png]]

Yes, very red indeed. 

Using `exiftool red.png`, we find the following poem: 

```
Crimson heart, vibrant and bold, Hearts flutter at your sight. Evenings glow softly red, Cherries burst with sweet life. Kisses linger with your warmth. Love deep as merlot. Scarlet leaves falling softly, Bold in every stroke.
```

Putting together the capitalized letters spells "CHECK LSB". Least significant bit (LSB) steganography hides data within the least significant bit of each byte of the original data. We can detect LSB stego using `zsteg`:  `zsteg red.png` shows us that `b1,rgba,lsb,xy` contains some base64 encoded text:

![[zsteg.png]]

Decoding this yields the flag.
## Flag
`picoCTF{r3d_1s_th3_ult1m4t3_cur3_f0r_54dn355_}`