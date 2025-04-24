---
title: "picoCTF 2025: hash-only-1"
tags:
  - ctf
date: 2025-04-24
---
# Problem
![[media/ctf/picoCTF/hash-only-2/description.png]]
# Solution
Similar to [[hash-only-1]], let's take a quick survey:

![[media/ctf/picoCTF/hash-only-2/ls.png]]

Huh, no `flaghasher` here. Where is it then?

![[which flaghasher.png]]

OK there it is. Checking the strings again, the binary appears to be identical to that from the previous problem (so I'll spare the screenshot). However, the same trick as before won't work since we are restricted from using `scp`. So we'll have to construct the script on the target machine. One problem: the means to do so appear to be missing; there is no text editor (`nano`, `vi`, `vim`, `nvim`, `emacs`, etc.) and redirection (`>`) is restricted.

![[restriction.png]]

After some quick reading, luckily, I discovered that `tee` could do the trick and it is not restricted!

![[tee to the rescue.png]]

To construct the script with `tee`, we simply append the desired lines like so:

```bash
echo '#!/bin/bash' | tee md5sum
echo 'cat /root/flag.txt' | tee -a md5sum
```

Now, all that is left is to figure out the path precedence in searching for binaries. The first matching binary is used, so we want our `md5sum` to take higher precedence than the real `md5sum`. Checking `$PATH`, we see:

![[echo path.png]]

So if we place our malicious `md5sum` in `/usr/local/bin`, it will take precedence over the actual `md5sum` in `/usr/bin`. That is, when `flaghasher` calls `md5sum`, our malicious version will be run instead! Let's put the final piece of the puzzle into place:

```bash
mv md5sum /usr/local/bin
```

Running `flaghasher` once again prints the flag for us!