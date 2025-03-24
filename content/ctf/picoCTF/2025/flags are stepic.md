---
title: "picoCTF 2025: flags are stepic"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/flags are stepic/description.png]]
# Solution
I'm going to start by saying I disliked this challenge - it felt like more of a "gotcha" than anything. 

The first thing I did was search the Internet for "stepic" as I had never heard/seen that word before, and apparently neither has DuckDuckGo because I found nothing relevant. No big deal, I'll figure something out. It takes but a few moments to find the PNG that stands out from the list, `upz.png`:

![[upz.png]]

I tried some basic tools on this file: `strings`, `xxd`, `binwalk`, and `exiftool`. I found nothing. I consulted a few sites that list different image forensics tools [^1][^2][^3], and tried the following: 

- `zsteg`: Crashes
- `pngcheck`: Returns "OK"
- `stegoveritas`: Crashes
- `openstego`: Crashes
- `stegseek`: Crashes
- `stegpy`: Outputs `ERROR! No encoded info found!`
- `stegsolve`: Finds nothing
- `convert`: Crashes
- `scalpel` Crashes
- `foremost`: Finds nothing
- `xortool`: Finds nothing

I wasted hours trying different things. I still didn't know what "stepic" even meant. I eventually tried searching on Google, and came across a really old pip package named [`stepic`](https://pypi.org/project/stepic/) with the description "Python image steganography". Are you fr?

Running `stepic -d -i upz.png` spits out the flag. 

I suppose this is the nature of forensics - scarcely glamorous, often tedious - yet, I can't help but feel this problem was a bit cheap.
## Flag
`picoCTF{fl4g_h45_fl4g51d83cb1}`

[^1]: https://lydia-england.github.io/ncl-tools/tools/forensics-tools.html#Forensics  
[^2]: https://0xrick.github.io/lists/stego/  
[^3]: https://lydia-england.github.io/ncl-tools/tools/steg-tools.html  