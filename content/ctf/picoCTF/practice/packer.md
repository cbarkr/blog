---
title: "picoCTF 2024: packer"
tags:
  - ctf
date: 2025-02-11
---
# Problem
![[media/ctf/picoCTF/packer/description.png]]
# Solution
When in doubt, disassemble the `out`. I threw this binary into Binary Ninja, inspected the strings, and saw nothing but gibberish. Near the end, however, lay a clue:

![[packed-strings.png]]

As the challenge's name suggests, this binary was indeed packed. Before now, I'd never heard of UPX, but a quick search told me everything I needed to know. I installed `upx` and did a quick `upx --help` to learn what's what. Then I ran `upx -d out -oout-unpacked` to unpack `out` and output the result to a new file named `out-unpacked`. 

Opening Binary Ninja once again, this time with `out-unpacked`, I returned to the string view. Unsurprisingly, I found less gibberish. Surprisingly, however, I found the flag in (almost) plaintext:

![[unpacked-strings.png]]

The full string is: `Password correct, please see flag: 7069636f4354467b5539585f556e5034636b314e365f42316e34526933535f33373161613966667d`.

Converting the hex to ASCII yields the flag.
## Flag
`picoCTF{U9X_UnP4ck1N6_B1n4Ri3S_371aa9ff}`
