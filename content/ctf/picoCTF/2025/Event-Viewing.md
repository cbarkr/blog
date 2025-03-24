---
title: "picoCTF 2025: Event-Viewing"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/Event-Viewing/description.png]]
# Solution
Since we're given an event log, we should take a look in an event log viewer. Windows comes pre-installed with *Event Viewer*, which is what I used in a VM. 

After loading the log file in Event Viewer, I searched for the *eventID*s associated with the three steps of the story as given above:

1. Install = 1033
2. Registry change = 4657
3. Shutdown = 1077

Filtering the event logs on each of these eventIDs, we find each part of the flag.
## 1. Install (eventID = 1033)
![[part1.png]]

`cGljb0NURntFdjNudF92aTN3djNyXw==` -> `picoCTF{Ev3nt_vi3wv3r_`
## 2. Registry Change (eventID = 4657)
![[part2.png]]

`MXNfYV9wcjN0dHlfdXMzZnVsXw==` -> `1s_a_pr3tty_us3ful_`
## 3. Shutdown (eventID = 1077)
![[part3.png]]

`dDAwbF84MWJhM2ZlOX0=` -> `t00l_81ba3fe9}`
## Flag
`picoCTF{Ev3nt_vi3wv3r_1s_a_pr3tty_us3ful_t00l_81ba3fe9}`