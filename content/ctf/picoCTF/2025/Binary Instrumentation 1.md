---
title: "picoCTF 2025: Binary Instrumentation 1"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/Binary Instrumentation 1/description.png]]
# Solution
For this challenge, I started by setting up a new Windows VM. Windows thinks the binary is malicious (I suspect because it's packed with [AtomPePacker](https://github.com/NUL0x4C/AtomPePacker)), so I had to set an exclusion to prevent the file from being quarantined. 

![[packer.png]]

Running the binary in the VM, we see that it prints some text then sleeps indefinitely, after which point it supposedly prints the flag. 

I've recently gained some experience using Frida for Android instrumentation, so it was pretty simple to set up a script that hooks the `Sleep` call and terminates it immediately. Here's the script I wrote for this:

```js
var k32 = Module.findExportByName("kernel32.dll", "Sleep")  
  
if (k32) {  
       Interceptor.replace(k32, new NativeCallback(function(ms) {  
               console.log("Sleep Intercepted!")  
               return // Skip the sleep  
       }, "void", ["uint32"]))  
}
```

To run the program as instrumented with our Frida script, we must use `frida -f bininst1.exe -l hook.js`:

![[frida.png]]

Now we have the flag in base64, which we simply decode to get the plaintext flag.