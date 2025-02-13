---
title: "LA CTF 2025: extended"
tags:
  - ctf
date: 2025-02-09
---
# Problem
![[media/ctf/LA CTF/extended/description.png]]
# Solution
Let's start by taking a look at `chall.py`:

```python
flag = "lactf{REDACTED}"  
extended_flag = ""  
  
for c in flag:  
	o = bin(ord(c))[2:].zfill(8)  
	
	# Replace the first 0 with a 1  
	for i in range(8):  
		if o[i] == "0":  
			o = o[:i] + "1" + o[i + 1 :]  
			break  
	
	extended_flag += chr(int(o, 2))  
	
print(extended_flag)  

with open("chall.txt", "wb") as f:  
	f.write(extended_flag.encode("iso8859-1"))
```

Something that stands out is this section here:

```python
# Replace the first 0 with a 1  
for i in range(8):  
	if o[i] == "0":  
		o = o[:i] + "1" + o[i + 1 :]  
		break  
```

The keen eye will notice that nothing is replaced at all! In Python's slice and range notation, `start` is inclusive but `stop` is not; that is, the range is $[start, stop)$.So the line `o = o[:i] + "1" + o[i + 1 :]` merely inserts a "1" *before* the first zero, but does not replace it. With this in mind, reversing the "extended" charset is quite simple.
## Script
```python
with open("chall.txt", "rb") as f:  
	c = f.read().decode("iso8859-1")  

flag = "" 

for i in c:  
	binstring = bin(ord(i))[2:]  
	
	for j in range(len(binstring)):  
		if binstring[j] == "0":
			binstring = binstring[:j-1] + binstring[j:]  
			break 
	
	flag += chr(int(binstring, 2))  

print(flag)
```
## Flag
`lactf{Funnily_Enough_This_Looks_Different_On_Mac_And_Windows}`
