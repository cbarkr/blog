---
title: "picoCTF 2025: 3v@l"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/3v@l/description.png]]
# Solution
Upon launching our problem instance, we're given a link to the loan calculator. If we inspect the HTML, we notice the following comment: 

```html  
<!--  
   TODO  
   ------------  
   Secure python_flask eval execution by    
       1.blocking malcious keyword like os,eval,exec,bind,connect,python,socket,  
ls,cat,shell,bind  
       2.Implementing regex: r'0x[0-9A-Fa-f]+|\\u[0-9A-Fa-f]{4}|%[0-9A-Fa-f]{2}|  
\.[A-Za-z0-9]{1,3}\b|[\\\/]|\.\.'  
-->  
```  

So we not only know the exact regex used to filter our inputs, but also the programming language with which our inputs are interpreted (Python). I started by throwing the regex into https://regex101.com/ to test different combinations of inputs. 

We want to get the flag from the file `flag.txt` which resides in the root directory of the server. File extensions are matched by the regex, but can be bypassed by string concatenation (e.g. "flag.txt" = "flag" + "." + "txt"). Then, since slashes are similarly detected, we have to encode them using something like `chr(47)` (where `ord("/")` = 47).

The following payload outputs the flag at `/flag.txt`:

```python
open(chr(47) + "flag" + "." + "txt").read()
```