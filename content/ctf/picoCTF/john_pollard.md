---
title: "picoCTF 2019: john_pollard"
tags:
  - blog
  - ctf
  - cryptography
date: 2025-02-01
---
# Problem
![[media/ctf/picoCTF/john_pollard/description.png]]
# Solution
We are given the following certificate:

```
-----BEGIN CERTIFICATE-----  
MIIB6zCB1AICMDkwDQYJKoZIhvcNAQECBQAwEjEQMA4GA1UEAxMHUGljb0NURjAe  
Fw0xOTA3MDgwNzIxMThaFw0xOTA2MjYxNzM0MzhaMGcxEDAOBgNVBAsTB1BpY29D  
VEYxEDAOBgNVBAoTB1BpY29DVEYxEDAOBgNVBAcTB1BpY29DVEYxEDAOBgNVBAgT  
B1BpY29DVEYxCzAJBgNVBAYTAlVTMRAwDgYDVQQDEwdQaWNvQ1RGMCIwDQYJKoZI  
hvcNAQEBBQADEQAwDgIHEaTUUhKxfwIDAQABMA0GCSqGSIb3DQEBAgUAA4IBAQAH  
al1hMsGeBb3rd/Oq+7uDguueopOvDC864hrpdGubgtjv/hrIsph7FtxM2B4rkkyA  
eIV708y31HIplCLruxFdspqvfGvLsCynkYfsY70i6I/dOA6l4Qq/NdmkPDx7edqO  
T/zK4jhnRafebqJucXFH8Ak+G6ASNRWhKfFZJTWj5CoyTMIutLU9lDiTXng3rDU1  
BhXg04ei1jvAf0UrtpeOA6jUyeCLaKDFRbrOm35xI79r28yO8ng1UAzTRclvkORt  
b8LMxw7e+vdIntBGqf7T25PLn/MycGPPvNXyIsTzvvY/MXXJHnAqpI5DlqwzbRHz  
q16/S1WLvzg4PsElmv1f  
-----END CERTIFICATE-----
```

Using `openssl`, we can verify its details using 

```bash
openssl x509 -in cert -text -noout
```

which yields the following output:

![[cert_details.png]]

Something of note is the size of the modulus; it's tiny! Hence it's factors ($p$ and $q$) are even smaller and therefore easily recoverable. By working backwards from the square root of the modulus[^so], the first prime that evenly divides it will be one of $p$ or $q$, with which we can obtain the other missing value. 
## Script
```python
from gmpy2 import iroot  
  
def find_p(n):  
       sqrtn = iroot(n, 2)[0]  
       cbrtn = iroot(n, 3)[0]  
  
       for i in range(sqrtn, cbrtn, -2):  
               if n % i == 0:  
                       return i  
  
if __name__ == "__main__":  
       n = 4966306421059967  
       p = find_p(n)  
       q = int(n/p)  
       res = "picoCTF" + "{" + f"{q}" + "," + f"{p}" + "}"  
       print(res2)
```
## Flag
`picoCTF{73176001,67867967}`

[^so]: https://stackoverflow.com/a/4079137
