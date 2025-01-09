---
title: "picoCTF 2024: heap 3"
tags:
  - blog
  - ctf
date: 2024-12-20
---
# Problem
![[media/ctf/picoCTF/heap 3/description.png]]
# Solution
In this problem, we're given a binary, `chall`, and it's source code, `chall.c`. Before inspecting the source, let's run the binary.

Running `chall` locally will greet us with a hint:

![[hint.png]]

This points us in the direction of a use after free (UAF) vulnerability. The intuition is nicely explained by this illustration from the [CWE entry](https://cwe.mitre.org/data/definitions/416.html):

![[mitre_uaf.png]]

Before exploiting the vulnerability, let's first demonstrate it. We first print the heap:

![[heap_init.png]]

Then we free `x` and print `x->flag`. Notice that printing `x->flag` produces the same result as before. Why is that?

![[uaf.png]]

This is because `free` does not remove `x`'s data from the heap, but rather, marks that chunk of memory as available to re-allocate. `x->flag`, when used after `x` is freed, still references the same address and thus retrieves the same value as before. 

The task is then very simple: allocate our own object that changes the value accessed by `x->flag`. Let's now take a look at `chall.c` to see how we can do this.
## `chall.c`
Two of the most important portions of the source code are highlighted below. 
### `object`
First (and most notably), `x` is an instance of a `struct` named `object`. 

```c
// Create struct  
typedef struct {  
 char a[10];  
 char b[10];  
 char c[10];  
 char flag[5];
} object;  

object *x;  
```

`object`'s members will be stored in contiguous memory addresses, so overflowing one will leak into the next. 

Once `x` is freed, `x->flag` can be changed into any four letter string (remember the null terminator! or don't) by simply allocating 30 characters of junk data to bypass `a`, `b`, and `c`, followed by the new value:

```
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA<win>
```
### `check_win`
Second, `check_win` leaks the `<win>` condition.

```c  
void check_win() {  
 if(!strcmp(x->flag, "pico")) {
   printf("YOU WIN!!11!!\n");  

   // ...
}
```

Hence, our payload is 

```
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAApico
```
## Win
![[win.png]]

The flag is `picoCTF{now_thats_free_real_estate_f8fb9f96}`.

![[free_real_estate.png]]