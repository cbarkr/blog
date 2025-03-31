---
title: "Swamp CTF 2025: Intercepted Communications"
tags:
  - ctf
  - cryptography
date: 2025-03-30
---
# Problem
![[media/ctf/SwampCTF/Intercepted Communications/description.png]]
# Solution
What really stands out in this description is the line "We have reason to believe they're not following **otp**-imal security practices". Sounds like a **o**ne-**t**ime **p**ad is being misused; rather, that there is a two-time pad in our midst. 

We're given a file, `Captured_comms.zip`, when, unzipped, has the following structure:

```
Captured_comms/  
├── Important_Message_Captured.txt  
├── M1  
│   ├── decrypted.txt  
│   └── encrypted.txt  
├── M2  
│   ├── decrypted.txt  
│   └── encrypted.txt  
├── M3  
│   ├── decrypted.txt  
│   └── encrypted.txt  
├── M4  
│   ├── decrypted.txt  
│   └── encrypted.txt  
└── M5  
   ├── decrypted.txt  
   └── encrypted.txt
```

Each file is a binary string. For example, `M1/decrypted.txt` contains the following:

```
01001000011001010111100100101100001000000100100100100000011001100110111101110010011001110110111101110100001000000110110101111001001000000110101001100001011000110110101101100101011101000010000001100001011101000010000001110100011010000110010100100000011011110110011001100110011010010110001101100101001011100010000001000011011000010110111000100000011110010110111101110101001000000110001001110010011010010110111001100111001000000110100101110100001000000111001001101111011101010110111001100100001000000111011101101000011001010110111000100000011110010110111101110101001000000110001101101111011011010110010100100000011000100111100100100000011011000110000101110100011001010111001000111111001000000100111101101000001011000010000001100001011011100110010000100000011101110110100001101001011011000110010100100000011110010110111101110101001001110111001001100101001000000111010001101000011001010111001001100101001011000010000001100011011000010110111000100000011110010110111101110101001000000110001101101000011001010110001101101011001000000110100101100110001000000110110101111001001000000110001101101111011011010111000001110101011101000110010101110010001000000111010001110101011100100110111001100101011001000010000001101111011011100010000001100010011110010010000001101001011101000111001101100101011011000110011000100000011000010110011101100001011010010110111000111111
```

Which, if printed using the following Python script, corresponds to the message "Hey, I forgot my jacket at the office. Can you bring it round when you come by later? Oh, and while you're there, can you check if my computer turned on by itself again?".

```python
with open("Captured_comms/M1/decrypted.txt", "r") as f:  
	c = int(f.read(), 2)

print(c.to_bytes(len(str(c)), "big").strip(b"\x00"))
```

Since the encryption scheme is hinted-at being a one-time pad, we expect that $C = M \oplus K$, where $C$ is the ciphertext, $M$ is the message, and $K$ is the key. If there truly is a two-time pad among these message-ciphertext pairs, then there exists some $K_{ttp}$ such that $C_i = M_i \oplus K_{ttp}$ and $C_j = M_j \oplus K_{ttp}$, which means that given either ($C_i, M_i$) or ($C_j, M_j$), we can get $K_{ttp}$ by computing $K_{ttp} = C_k \oplus M_k$ where $k \in \set{i,j}$, and therefore $M_{\lnot k} = C_{\lnot k} \oplus K_{ttp}$.

To achieve this, I computed the keys of each given message-ciphertext pair, then decrypted the `Important_Message_Captured` using each of these keys to see if a coherent message can be uncovered. I wrote the following script to do so:

```python
c_list = []  
m_list = []  
  
for i in range(1, 6):  
       with open(f"Captured_comms/M{i}/encrypted.txt") as f:  
               c_list.append(int(f.read(), 2))  
  
       with open(f"Captured_comms/M{i}/decrypted.txt") as f:  
               m_list.append(int(f.read(), 2))  
  
with open("Captured_comms/Important_Message_Captured.txt", "r") as f:  
       c = int(f.read(), 2)  
  
k_list = [m ^ c for m, c in zip(m_list, c_list)]  
ttp_list = [c ^ k for k in k_list]  
  
for ttp in ttp_list:  
       print(ttp.to_bytes(len(str(ttp)), "big").strip(b"\x00"))
```

Four of the keys produce nonsense, but one key produces a clear message, which tells us that this key was in fact used as a two-time pad:

```
b'M\xe9%\x9a\xb7\xdaW\x89\xc5\xee\x7f\x19\xf0\xc5P\x92\xcc\xfc\x13\x7fO?\xf3A\xc9=\x8eiK|\x04\xde\xf0(\x1auhS\xc6\x9cO\x05\x95T(^\x07S\xe1\xa5\x19.\xd8\n7\x  
97\x15\xb7\xb4\xbf\xd2\x80\x12\xca\xa8\xd6\xf5\x80\xdf\xdf\xb4",\xd3\x04\xa1\xb0p2\x04q\xbbnK\xf6\x04\x92\x9c\xe9\xfd1E\xc9\x88H\xe2\x18\x1d#\x05h\xeb5\xa10  
I.\xf3\x8b\x0c\x86d:\xcf\tLM\xebOk\xf1\xb8\xd8\x17R/Q\x96\x19\x84F\xfc+\xbf\xc6\xa2\x7f;&\x9d\xeb\xed0C\x81\xfb\r\x84\x05\xa2\x00\xe5\xfd\xa7\x7f\xa0\x93l\x  
d8~/5\xad\x10h\xdf\xc9 \xe4'  
b'4\xf7=)\xe9K\xc1\xf80\x13\xd2\x96\x14Iut\xd7C\xd4\t\x17M\x83\xaa\x9d\x96\xc2\xb1d"D\xc6\xa2;\xf7\x8aK$\x95$\xe3\xf3\r\xf8\xa67\xa3z\x9c\xdf\x9d\xf5\x8c\x8  
fM-\xd0\x9a\xb4\xdc\xee6J[)_\x1e\x8c\x82T\xd9\x8d\xc5\xc64\x01\xb7\xf0\xc6\xa1\xf0\x0eQC\x90W\x91\xff\x17\xc3jK\x90\x0ef_\x8e\x9b\xd9\xf0|\x16\xd5G)\x82\xcd  
\xe2\x06:&\xe8\xb7\xd0T\xec\xefNp\x0b(\x82\x96<#B\xdd\rS\x9b\xda\x03\x9c\x07]("\x9bV*\xcc\x8d\x9fd\xe8XK\x83'  
b'4\xf7=)\xe9KoJ69(\x16\xd1T}.\t\xdc\xd1l\xcdwE\x92\x08U\x9a\x7fL\xbf\xbe\xef\xecI\x18T\xaf\xa06%{\xf2(\x8e?\x17B\x15\x03\xed\xb3\xe4e\xd1\xd4\xf2\xd6\xba\x  
f2\x13\xaf\xa8Tw\x12\xe0&\x9f|xN\xdb\xf4\xbb\xf3\x90\xee\xca\x88o5\xfb\x12\xb025\x93s\xc6\x1c\x81p\xf0\\\xe7v\x15\xbe\xb6\xa4\xe9n\x99*\x8e]AG\xd3$\xc3:\xf5  
9\x0e\xa4\xc0,N"iX\xe0\xd7p<k\x85C\xe3M\t\xd7\xa3\xe3\x9cI\xa9\x82\xb8a\x93\x0c\x87N\xa1\xb1\x08'  
b"Transferring credentials now. Be sure to keep them secret, we don't want these getting out. [Username: Admin, Password: swampCTF{REDACTED}]"  
b'4\xf7=)\xe9KoJ69(\x16\xd1T}.\t\xdc\xd1l\xcdwE\x92\x08U>\xe9\x8bv\xa8\xaf\xea0\xc9\xf5\x8d\xa0\x00\xfaq\xb6\xe1\x85\xb6\x1d\xc2D\x8f\xe1\x03\x9e\xe1vp\xa3J  
\x98\x1f\xa0o\x11z\xfe\xf6\x91\xd9%\xf1\xaaR0\xfa4\xc3\xaf\xe2\x0c\x86\xdf|,\x17\xae\x04t\xb8g\xabT\x17\xdb\xb9\xdc\xa9\xe5a\x9a]\xa2RlZe\x04?\xfc\xa2J\x91\  
xe9c8\xf6}i\x12\x15\xfd\xf5\x99K\x97\\u}F4![%\xd8\xc9S\xf7G\xed\x8dY\x98o>\xb8\xb6\x8c@\xf2\xb2'
```