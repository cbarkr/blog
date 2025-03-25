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
## 2. Registry Change (eventID = 4657)
![[part2.png]]
## 3. Shutdown (eventID = 1077)
![[part3.png]]