---
title: "picoCTF 2024: FactCheck"
tags:
  - ctf
date: 2025-02-12
---
# Problem
![[media/ctf/picoCTF/FactCheck/description.png]]
# Solution
As I said in [[packer]]:

> [!quote]
> When in doubt, disassemble the `out`

I threw this binary into Binary Ninja, took a look at the strings, and found the first part of the flag:

![[media/ctf/picoCTF/FactCheck/strings.png]]

I naively assumed the next string, `95a3cedb6`, would be the next part of the flag, so I tried to submit `picoCTF{wELF_d0N3_mate_95a3cedb6}`. \*loud buzzer noise\*

Let's take a closer look at `main`:

![[main1.png]]
![[main2.png]]
![[main3.png]]
![[main4.png]]
![[main5.png]]

What I gather from this is that there is a lot of string concatenation going on. So I set a breakpoint on the final string concatenation before all the strings' memory is deallocated (that is, on `0x0x55555555585b`):

![[breakpoint.png]]

Then ran the debugger and inspected the register values at this point:

![[register_hint.png]]

The "hint" is less of a hint, more of a giveaway!