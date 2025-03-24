---
title: picoCTF 2025 Writeup
tags:
  - ctf
date: 2025-03-17
---
![[media/ctf/picoCTF/2025 Writeup/logo.png]]

[picoCTF 2025](https://www.picoctf.org/competitions/2025-spring.html) just wrapped up and I thought I'd make a writeup to document my experience. While I've been practising on picoCTF for a few months, this was my first time participating in a live event. I'd say it went pretty well! 
# Recap
I joined up with a friend of mine (who, fun fact, was the one who got me into CTFs a few months ago) to form the team "[New Team (1)](https://play.picoctf.org/teams/15596)". Together, we solved 30/41 challenges (excluding one which was removed after we completed it) totalling to 4610/8510 points. 

![[team_progress1.png]]
![[team_progress2.png]]

I contributed 25 solutions (3835 points) to our total with the following:

1. Binary Exploitation
	1. [[PIE TIME]]
2. Cryptography
	1. [[hashcrack]]
	2. [[EVEN RSA CAN BE BROKEN???]]
	3. [[ChaChaSlide]]
3. Forensics
	1. Ph4nt0m 1ntrud3r
	2. [[RED]]
	3. [[flags are stepic]]
	4. [[Bitlocker-1]]
	5. [[Bitlocker-2]]
	6. [[Event-Viewing]]
4. General Skills
	1. FANTASY CTF
	2. Rust fixme 1
	3. Rust fixme 2
	4. Rust fixme 3
	5. [[YaraRules0x100]]
5. Reverse Engineering
	1. [[Binary Instrumentation 1]]
	2. [[Tap into Hash]]
	3. [[Quantum Scrambler]]
6. Web Exploitation
	1. Cookie Monster Secret Recipe
	2. head-dump
	3. [[n0s4n1ty 1]]
	4. [[SSTI1]]
	5. [[SSTI2]]
	6. [[3v@l]]
	7. [[Pachinko]]

> [!note] 
> Simple challenges don't get writeups :P

Our team placed 402/10460 globally (in the top 4%). Given there were only two of us on the team and its a busy time of year with school, I'm happy with the result!

![[team_rank.png]]
# Reflection
So what did I learn from this? 

For one, I still have much to learn! Despite completing nearly every cybersecurity course offered to undergrads at SFU, practising CTFs, and working in a relevant field, I still find myself struggling with certain categories (such as binary exploitation). For instance, [[PIE TIME]] and [[PIE TIME 2]] were simple enough (though I didn't solve #2 during the competition period for some reason?? I'm not sure why), however I was unable to solve any other binary exploitation challenges. I like to learn, so this isn't a problem - it just takes time (but finding time is always the hardest part, isn't it?). I'd like to be as well-rounded as possible, ideally not constrained to specializing in a specific category, so I intend to focus on those challenges I struggle with most.

For two, teamwork makes the dream work. My teammate was able to solve a number of the challenges that made absolutely zero sense to me. Having a rubber ducky, second opinion, helping hand, etc. not only makes up for one's shortcomings, but also enhances their strengths. In future events, I'd like to join a strong team to learn from them and vice versa.

