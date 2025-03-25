---
title: "picoCTF 2025: Quantum Scrambler"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/Quantum Scrambler/description.png]]
# Solution
We are given the following script: 

```python
import sys

def exit():
  sys.exit(0)

def scramble(L):
  A = L
  i = 2
  while (i < len(A)):
    A[i-2] += A.pop(i-1)
    A[i-1].append(A[:i-2])
    i += 1
    
  return L

def get_flag():
  flag = open('flag.txt', 'r').read()
  flag = flag.strip()
  hex_flag = []
  for c in flag:
    hex_flag.append([str(hex(ord(c)))])

  return hex_flag

def main():
  flag = get_flag()
  cypher = scramble(flag)
  print(cypher)

if __name__ == '__main__':
  main()
```

From `main`, we see that first the flag is converted into a list of hexadecimals in `get_flag`, then `scramble`d.

We are given one such example of this in the file `enc_flag` (which I have omitted for brevity). By encoding a simpler message (e.g. "abcdef"), we can get a better feel for what `scramble` does:

```
[['0x61', '0x62'], ['0x63', [], '0x64'], ['0x65', [['0x61', '0x62']]], ['0x66']]
```

Recall that in ASCII:
- "a" = 61
- "b" = 62
- And so on

We might observe a bit of a pattern - each letter is stored in order within a nested list, and is only ever repeated within a further nested list. 

So what happens if we simply remove any nested lists and flattened the result? We're left with the hex-encoded flag. Decode it and we're done. I wrote the following script for this:

## Script
```python
import itertools

def unscramble(L):
    A = L

    for a in A:
        for idx, elem in enumerate(a):
            if isinstance(elem, list):
                a.pop(idx)

    return list(itertools.chain.from_iterable(A))


def get_flag(hex_flag):
    flag = ""

    for i in hex_flag:
        curr = int(i, 16)
        flag += chr(curr)

    return flag


def main():
    with open("enc_flag", "r") as f:
        c = eval(f.read())

    unscrambled = unscramble(c)
    flag = get_flag(unscrambled)
    print(flag)


if __name__ == "__main__":
    main()
```
