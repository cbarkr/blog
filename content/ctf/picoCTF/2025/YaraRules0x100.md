---
title: "picoCTF 2025: YaraRules0x100"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/YaraRules0x100/description.png]]
# Solution
The suspicious file, aptly named `suspicious.exe`, is a UPX-packed binary. We can tell by the fact that the string "UPX" precedes some ZLIB-compressed data. In order to get some meaningful information with which we can create our YARA rules, we must unpack the binary.

Running `upx -d suspicious.exe -osusicious_unpacked.exe` outputs the unpacked binary as `susicious_unpacked.exe`. Taking a look at the strings in this file, we see the following:

![[sus.png]]

(among others). While this might make for a rather unique signature, I decided a more complete ruleset ought to rely on other strings, including [which Windows API calls are frequently used by malware](https://sensei-infosec.netlify.app/forensics/windows/api-calls/2020/04/29/win-api-calls-1.html). 

```yara
rule packed_YaraRules0x100 {  
       strings:  
               $upx1 = "UPX!" ascii  
               $upx2 = "UPX0" ascii  
               $upx3 = "UPX1" ascii  
  
               $str1 = "YaraRules0x100" ascii  
               $str2 = "LoadLibrary" ascii  
               $str3 = "VirtualProtect" ascii  
       condition:
	       // REF: https://dmfrsecurity.com/2021/12/30/100-days-of-yara-day-11-upx/  
               uint16(0) == 0x5A4D and  
               any of ($upx*) and  
               all of ($str*)  
}  
  
rule unpacked_YaraRules0x100 {  
       strings:  
               $str1 = "Welcome to the YaraRules0x100 challenge!" ascii  
               $str2 = "Suspicious" wide ascii  
               $str3 = "picoCTF" wide ascii  
               $str4 = "This is a fake malware. It means no harm" wide ascii  
  
               $in1 = "SHELL32.dll" ascii  
               $in2 = "KERNEL32.dll" ascii  
  
               $api1 = "OpenProcess" ascii  
               $api2 = "CreateToolhelp32Snapshot" ascii  
               $api3 = "GetProcAddress" ascii  
               $api4 = "GetCurrentProcess" ascii  
               $api5 = "GetCurrentProcessId" ascii  
               $api6 = "CreateThread" ascii  
               $api7 = "IsDebuggerPresent" ascii  
               $api8 = "QueryPerformanceCounter" ascii  
               $api9 = "LookupPrivilegeValue" ascii  
               $api10 = "AdjustTokenPrivileges" ascii  
               $api11 = "DebugActiveProcess" ascii  
               $api12 = "Sleep" ascii  
  
               $sec1 = "<requestedExecutionLevel level='asInvoker' uiAccess='false' />" ascii  
       condition:  
               any of ($str*) and  
               any of ($in*) and    
               all of ($api*) and  
               all of ($sec*)  
}
```
