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

To check if a UAF is in play here, let's print the heap,

![[heap_init.png]]

Now if we free `x` and print the heap again, we see that, although `x` itself does not exist, the memory location pointed to by `x->flag` is still occupied by the string `bico`!

![[uaf.png]]

So we have confirmed that `x->flag` is used after `x` is freed. If we can allocate memory at `x->flag`, we win. Let's now take a look at `chall.c` to see how we can do this.
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

`object`'s members will be stored in contiguous memory addresses, resembling a memory layout like this:

`| char a[10] | char b[10] | char c[10] | char flag[5] |`

Once we `free(x)`, we can simply allocate another (nearly) identical object containing the desired flag in place of the original. Then `x->flag` will point to the new flag.

The payload thus contains 30 characters of junk data to pad past `a`, `b`, and `c`; for example:

```
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA<win>
```
### `check_win`
Second, `check_win` leaks the win condition, indicating that the `<win>` value in our payload must be `pico`. 

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