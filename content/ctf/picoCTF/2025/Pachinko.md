---
title: "picoCTF 2025: Pachinko"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/Pachinko/description.png]]
# Solution
This one was strange to say the least. To be honest, I'm not exactly sure *how* I solved it. I will document here what I did to receive the flag, at least.

Not really sure what I was looking at, I just played with some of the elements in the UI, first pressing "Play Animation", then "Submit Circuit". After submitting, an alert popped up containing the flag:

![[media/ctf/picoCTF/Pachinko/flag.png]]

Thinking I broke the challenge, I played with it some more then clicked submit again. Same result. 

Did I get lucky? I'm not sure. But revisiting the problem while writing this, I am still able to reproduce the result intermittently so I'm not entirely sure.

Let's take a look at the source code to see what the heck is happening in `index.js`:

```javascript
function doRun(res, memory) {  
 const flag = runCPU(memory);  
 const result = memory[0x1000] | (memory[0x1001] << 8);  
 if (memory.length < 0x1000) {  
   return res.status(500).json({ error: 'Memory length is too short' });  
 }  
  
 let resp = "";  
  
 if (flag) {  
   resp += FLAG2 + "\n";  
 } else {  
   if (result === 0x1337) {  
     resp += FLAG1 + "\n";  
   } else if (result === 0x3333) {  
     resp += "wrong answer :(\n";  
   } else {  
     resp += "unknown error code: " + result;  
   }  
 }  
  
 res.status(200).json({ status: 'success', flag: resp });  
}

// ...

app.post('/check', async (req, res) => {  
   const circuit = req.body.circuit;  
  
   if (!Array.isArray(circuit) ||    
       !circuit.every(entry => checkInt(entry?.input1) &&    
                               checkInt(entry?.input2) &&    
                               checkInt(entry?.output))) {  
       return res.status(400).end();  
   }  
  
   const program = await fs.readFile('./programs/nand_checker.bin');  
      
   // Generate random input state with only 0x0000 or 0xffff values  
   const inputState = new Uint16Array(4);  
   for (let i = 0; i < 4; i++) {  
       inputState[i] = Math.random() < 0.5 ? 0x0000 : 0xffff;  
   }  
      
   // Create output state as inverse of input  
   const outputState = new Uint16Array(4);  
   for (let i = 0; i < 4; i++) {  
       outputState[i] = inputState[i] === 0xffff ? 0x0000 : 0xffff;  
   }  
      
   const serialized = serializeCircuit(  
       circuit,  
       program,  
       inputState,  
       outputState  
   );  
  
   doRun(res, serialized);  
});
```

So if `memory[0x1000] | (memory[0x1001] << 8) == 0x1337`, then we get the flag. But just what is `memory`? In the `/check` endpoint, we see that `doRun` is invoked with `memory = serialized`, where:

```
serialized = serializeCircuit(circuit,program,inputState,outputState);
```

However, `inputState` is instantiated to a "random" value, so it's possible that this is responsible for the behaviour we're seeing. We can't know unless we see what `serializeCircuit` does. In `utils.js`, we see that `serializeCircuit` is defined as follows:

```javascript
function serializeCircuit(circuit, program, inputState, outputState) {  
   const memory = new Uint8Array(65536); // 64KB memory  
  
   // Copy program at start  
   memory.set(program);  
  
   // Serialize output state at 0x1000  
   const outputView = new Uint16Array(memory.buffer, 0x1000);  
   outputView[0] = outputState.length;  
   outputView.set(outputState, 1);  
  
   // Serialize input state at 0x2000  
   const inputView = new Uint16Array(memory.buffer, 0x2000);  
   inputView.set(inputState, outputState.length + 1);  
  
   // Serialize circuit at 0x3000  
   const circuitView = new Uint16Array(memory.buffer, 0x3000);  
   circuit.forEach((gate, i) => {  
       const offset = i * 3;  
       circuitView[offset] = gate.input1;  
       circuitView[offset + 1] = gate.input2;  
       circuitView[offset + 2] = gate.output;  
   });  
  
   return memory;  
}
```

Let's also take a look at the program `nand_checker.bin`, which we can disassemble using `objdump -b binary -m i386:x86-64 -D nand_checker.bin`:

```
nand_checker.bin:     file format binary  
  
  
Disassembly of section .data:  
  
0000000000000000 <.data>:  
  0:   4d 00 00                rex.WRB add %r8b,(%r8)  
  3:   30 5d 00                xor    %bl,0x0(%rbp)  
  6:   00 10                   add    %dl,(%rax)  
  8:   6d                      insl   (%dx),%es:(%rdi)  
  9:   00 00                   add    %al,(%rax)  
  b:   20 08                   and    %cl,(%rax)  
  d:   00 01                   add    %al,(%rcx)  
  f:   04 2d                   add    $0x2d,%al  
 11:   00 00                   add    %al,(%rax)  
 13:   10 1b                   adc    %bl,(%rbx)  
 15:   00 04 02                add    %al,(%rdx,%rax,1)  
 18:   1c 22                   sbb    $0x22,%al  
 1a:   17                      (bad)  
 1b:   12 1c 4c                adc    (%rsp,%rcx,2),%bl  
 1e:   18 00                   sbb    %al,(%rax)  
 20:   1c 14                   sbb    $0x14,%al  
 22:   0b 04 44                or     (%rsp,%rax,2),%eax  
 25:   02 1b                   add    (%rbx),%bl  
 27:   04 44                   add    $0x44,%al  
 29:   02 2b                   add    (%rbx),%ch  
 2b:   04 44                   add    $0x44,%al  
 2d:   02 0c 4c                add    (%rsp,%rcx,2),%cl  
 30:   1c 4c                   sbb    $0x4c,%al  
 32:   2c 4c                   sub    $0x4c,%al  
 34:   01 00                   add    %eax,(%rax)  
 36:   11 01                   adc    %eax,(%rcx)  
 38:   21 02                   and    %eax,(%rdx)  
 3a:   01 06                   add    %eax,(%rsi)  
 3c:   11 06                   adc    %eax,(%rsi)  
 3e:   21 06                   and    %eax,(%rsi)  
 40:   0b 00                   or     (%rax),%eax  
 42:   1b 01                   sbb    (%rcx),%eax  
 44:   06                      (bad)  
 45:   01 29                   add    %ebp,(%rcx)  
 47:   00 78 00                add    %bh,0x0(%rax)  
 4a:   7c 22                   jl     0x6e  
 4c:   0b 05 1d 00 ff ff       or     -0xffe3(%rip),%eax        # 0xffffffffffff  
006f  
 52:   28 02                   sub    %al,(%rdx)  
 54:   78 00                   js     0x56  
 56:   51                      push   %rcx  
 57:   02 61 02                add    0x2(%rcx),%ah  
 5a:   3b 05 4b 06 37 73       cmp    0x7337064b(%rip),%eax        # 0x733706ab  
 60:   47 74 31                rex.RXB je 0x94  
 63:   04 3c                   add    $0x3c,%al  
 65:   6c                      insb   (%dx),%es:(%rdi)  
 66:   37                      (bad)  
 67:   32 3c 6c                xor    (%rsp,%rbp,2),%bh  
 6a:   7c 72                   jl     0xde  
 6c:   01 01                   add    %eax,(%rcx)  
 6e:   0c 7e                   or     $0x7e,%al  
 70:   7c 56                   jl     0xc8  
 72:   0d 00 33 33 5d          or     $0x5d333300,%eax  
 77:   00 00                   add    %al,(%rax)  
 79:   10 59 00                adc    %bl,0x0(%rcx)  
 7c:   0f 00 0d 00 37 13 5d    str    0x5d133700(%rip)        # 0x5d133783  
 83:   00 00                   add    %al,(%rax)  
 85:   10 59 00                adc    %bl,0x0(%rcx)  
 88:   0f                      .byte 0xf  
       ...
```

The `program`, `nand_checker.bin`, seems to be computing a checksum to see if the input state matches some expected state. How this works, I'm not sure, honestly. 