---
title: "Swamp CTF 2025: MuddyWater"
tags:
  - ctf
date: 2025-03-30
---
# Problem
![[media/ctf/SwampCTF/MuddyWater/description.png]]
# Solution
Taking a look at the PCAP, there appear to be many SMB2 packets. Knowing nothing about SMB2 or NTLM, I clicked around until I noticed the "NTLM Secure Service Provider" field.

To find the username and subsequently the password, we must first identify the successful login. Reviewing Wireshark's [SMB2](https://wiki.wireshark.org/SMB2) docs, I found that users are authenticated using the [SessionSetup](https://wiki.wireshark.org/SMB2/SessionSetup) command (opcode `0x01`). As the attacker is bruteforcing a login, the PCAP will be flooded with these, so we must identify a *successful* attempt of the command. The [`NT_Status`](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-erref/596a1078-e883-4972-9bbc-49e60bebca55) field with value `0x00000000` indicates successful operations. Thus, to find the successful login, we combine the two conditions to create the following Wireshark filter: `smb2.cmd == 0x01 and smb2.nt_status == 0`. Applying the filter yields only a single result:

![[media/ctf/SwampCTF/MuddyWater/pcap.png]]

To uncover the whole story, let's follow the TCP stream:

![[stream.png]]

Consulting [this](https://hashcat.net/forum/thread-2939.html) post, I discovered that NTLMv2 hashes can be cracked using Hashcat mode 5600 given the following information:

1. User name
2. Domain name
3. NTLM server challenge
4. NTLM proof string
5. NTLMv2 response

Packets 72065 and 72069 contain this information - 72065 providing the server challenge, and 72069 providing the rest. According to this post and Hashcat's [example hashes](https://hashcat.net/wiki/doku.php?id=example_hashes), the hash format is as follows:

```
<user name>::<domain name>:<server challenge>:<proof string>:<response (minus the proof string prefix)>
```

> [!note]
> The NTLMv2 response will contain the NTLM proof string as a prefix, remove this

Given the information we have found already, the hash can be constructed like so:

```
hackbackzip::DESKTOP-0TNOE4V:d102444d56e078f4:eb1b0afc1eef819c1dccd514c9623201:01010000000000006f233d3d9f9edb01755959535466696d0000000002001e004400450053004b0054004f0050002d00300054004e004f0045003400560001001e004400450053004b0054004f0050002d00300054004e004f0045003400560004001e004400450053004b0054004f0050002d00300054004e004f0045003400560003001e004400450053004b0054004f0050002d00300054004e004f00450034005600070008006f233d3d9f9edb010900280063006900660073002f004400450053004b0054004f0050002d00300054004e004f004500340056000000000000000000
```

I stored this in a file named `ntlmv2_hash.txt`, then ran `hashcat -m 5600 ntlmv2_hash.txt /usr/share/wordlists/rockyou.txt`:

![[cracked.png]]
