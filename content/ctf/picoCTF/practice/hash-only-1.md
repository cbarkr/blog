---
title: "picoCTF 2025: hash-only-1"
tags:
  - ctf
date: 2025-04-24
---
# Problem
![[media/ctf/picoCTF/hash-only-1/description.png]]
# Solution
Let's start by checking out the lay of the land. First, in `ctf-player`'s home directory, we find a `flaghasher` binary owned by `root`:

![[media/ctf/picoCTF/hash-only-1/ls.png]]

Taking a look at the binary's strings, we notice it uses `setuid` and `setgid`, and makes a `system` call using `/bin/bash md5sum /root/flag.txt`:

![[media/ctf/picoCTF/hash-only-1/strings.png]]

`setuid` and `setgid` allow us, the lowly `ctf-player`, to access `/root/flag.txt` when running `flaghasher`. We can exploit this behaviour by simply replacing the `md5sum` called with a simple bash script:

```bash
#!/bin/bash  
cat /root/flag.txt
```

But in order to replace `md5sum`, we need to know where the binary is. We can do this with `which`:

![[which md5sum.png]]

So after writing the script locally, `scp` can be used to transfer it to the target machine, replacing the existing `md5sum`:

```bash
scp -P <port> md5sum ctf-player@<url>:/usr/bin
```

Now, running `flaghasher` prints the flag for us :D