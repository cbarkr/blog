---
title: "picoCTF 2024: weirdSnake"
tags:
  - blog
  - ctf
date: 2025-02-07
---
# Problem
![[media/ctf/picoCTF/weirdSnake/description.png]]
# Solution
Despite using Python for a number of years, I've never actually looked at its bytecode (until now). I used this challenge (in addition to the act of writing about it) as a means to learn a bit about Python bytecode and how it works. 
## Background
> [!warning]
> For a proper explanation, see [^os]
### Syntax
```
line number  |  offset  |  instruction  |  arg  |  (value)
```

- `line number`: Corresponds to the line number in the original source
- `offset`: Offset into the original binary bytecodes[^so]
- `instruction`: The operation to execute
- `arg`: An argument to the instruction
- `value`: The value (literal, variable name, callable name, etc.)
### Pragmatics
CPython uses a stack-based VM [^os], the main types being:

1. Call Stack: For each function call, a frame is pushed to this stack; and every time a function call returns, its frame is popped off
2. Data Stack: Each frame in the call stack has one of these; within a function's execution, data is pushed to and popped from this stack
#### Instructions
> [!note]
> A complete list of instructions can be found in the [`dis` docs](https://docs.python.org/3/library/dis.html#dis.Instruction)

- `LOAD_*` instructions push a value to the stack
- `STORE_*` pops an item from the stack and stores it in a variable
- Most other instructions pop arguments from the stack (plus the callable) then push the result
### Example
Suppose I have the following Python function:

```python
def str_xor(A, B):  
       res = ""  
       for a, b in zip(A, B):  
               res += chr(ord(a) ^ ord(b))  
       return res
```

Running `dis` on the file, we can see its bytecode:

```
 0          0       RESUME                   0  
  
 1          2       LOAD_CONST               0 (<code object str_xor at 0x7f2525761bb0, file "str_xor.py", line 1>)  
            4       MAKE_FUNCTION  
            6       STORE_NAME               0 (str_xor)  
            8       RETURN_CONST             1 (None)  
  
Disassembly of <code object str_xor at 0x7f2525761bb0, file "str_xor.py", line 1>:  
 1          0       RESUME                   0  
  
 2          2       LOAD_CONST               1 ('')  
            4       STORE_FAST               2 (res)  
  
 3          6       LOAD_GLOBAL              1 (zip + NULL)  
           16       LOAD_FAST_LOAD_FAST      1 (A, B)  
           18       CALL                     2  
           26       GET_ITER  
     L1:   28       FOR_ITER                40 (to L2)  
           32       UNPACK_SEQUENCE          2  
           36       STORE_FAST_STORE_FAST   52 (a, b)  
  
 4         38       LOAD_FAST                2 (res)  
           40       LOAD_GLOBAL              3 (chr + NULL)  
           50       LOAD_GLOBAL              5 (ord + NULL)  
           60       LOAD_FAST                3 (a)  
           62       CALL                     1  
           70       LOAD_GLOBAL              5 (ord + NULL)  
           80       LOAD_FAST                4 (b)  
           82       CALL                     1  
           90       BINARY_OP               12 (^)  
           94       CALL                     1  
          102       BINARY_OP               13 (+=)  
          106       STORE_FAST               2 (res)  
          108       JUMP_BACKWARD           42 (to L1)  
  
 3   L2:  112       END_FOR  
          114       POP_TOP  
  
 5        116       LOAD_FAST                2 (res)  
          118       RETURN_VALUE 
```
## Breakdown
For the sake of readability, the challenge's bytecode is decomposed into sections based on the variable being operated on. 
### `input_list`
#### Bytecode
```
  1           0 LOAD_CONST               0 (4)
              2 LOAD_CONST               1 (54)
              4 LOAD_CONST               2 (41)
              6 LOAD_CONST               3 (0)
              8 LOAD_CONST               4 (112)
             10 LOAD_CONST               5 (32)
             12 LOAD_CONST               6 (25)
             14 LOAD_CONST               7 (49)
             16 LOAD_CONST               8 (33)
             18 LOAD_CONST               9 (3)
             20 LOAD_CONST               3 (0)
             22 LOAD_CONST               3 (0)
             24 LOAD_CONST              10 (57)
             26 LOAD_CONST               5 (32)
             28 LOAD_CONST              11 (108)
             30 LOAD_CONST              12 (23)
             32 LOAD_CONST              13 (48)
             34 LOAD_CONST               0 (4)
             36 LOAD_CONST              14 (9)
             38 LOAD_CONST              15 (70)
             40 LOAD_CONST              16 (7)
             42 LOAD_CONST              17 (110)
             44 LOAD_CONST              18 (36)
             46 LOAD_CONST              19 (8)
             48 LOAD_CONST              11 (108)
             50 LOAD_CONST              16 (7)
             52 LOAD_CONST               7 (49)
             54 LOAD_CONST              20 (10)
             56 LOAD_CONST               0 (4)
             58 LOAD_CONST              21 (86)
             60 LOAD_CONST              22 (43)
             62 LOAD_CONST              11 (108)
             64 LOAD_CONST              23 (122)
             66 LOAD_CONST              24 (14)
             68 LOAD_CONST              25 (2)
             70 LOAD_CONST              26 (71)
             72 LOAD_CONST              27 (62)
             74 LOAD_CONST              28 (115)
             76 LOAD_CONST              29 (88)
             78 LOAD_CONST              30 (78)
             80 BUILD_LIST              40
             82 STORE_NAME               0 (input_list)
```
#### Python
```python
input_list = [4, 54, 41, 0, 112, 32, 25, 49, 33, 3, 0, 0, 57, 32, 108, 23, 48, 4, 9, 70, 7, 110, 36, 8, 108, 7, 49, 10, 4, 86, 43, 108, 122, 14, 2, 71, 62, 115, 88, 78]
```
#### Explanation
- Each `LOAD_CONST` (there are 40 of them) pushes an integer value to the stack
- `BUILD_LIST 40` pops the preceding 40 items from the stack
- `STORE_NAME` stores the resulting list in a variable named `input_list`
### `key_str`
#### Bytecode
```

  2          84 LOAD_CONST              31 ('J')
             86 STORE_NAME               1 (key_str)

  3          88 LOAD_CONST              32 ('_')
             90 LOAD_NAME                1 (key_str)
             92 BINARY_ADD
             94 STORE_NAME               1 (key_str)

  4          96 LOAD_NAME                1 (key_str)
             98 LOAD_CONST              33 ('o')
            100 BINARY_ADD
            102 STORE_NAME               1 (key_str)

  5         104 LOAD_NAME                1 (key_str)
            106 LOAD_CONST              34 ('3')
            108 BINARY_ADD
            110 STORE_NAME               1 (key_str)

  6         112 LOAD_CONST              35 ('t')
            114 LOAD_NAME                1 (key_str)
            116 BINARY_ADD
            118 STORE_NAME               1 (key_str)
```
#### Python
```python
key_str = "t_Jo3"
```
#### Explanation
- Each `LOAD_CONST` pushes a value (in this case, strings) to the stack
- Each `LOAD_NAME` pushes the value associated with the supplied variable name to the stack
- Each `BINARY_ADD` acts as string concatenation. `BINARY_ADD` pops the top two items from the stack, adds the second to the first, then pushes the result to the stack
- Each `STORE_NAME` pops the last `BINARY_ADD` result from the stack and stores it in`key_str`
### `key_list`
#### Bytecode
```

  9         120 LOAD_CONST              36 (<code object <listcomp> at 0x7f5ef6665d40, file "snake.py", line 9>)
            122 LOAD_CONST              37 ('<listcomp>')
            124 MAKE_FUNCTION            0
            126 LOAD_NAME                1 (key_str)
            128 GET_ITER
            130 CALL_FUNCTION            1
            132 STORE_NAME               2 (key_list)

...

Disassembly of <code object <listcomp> at 0x7f5ef6665d40, file "snake.py", line 9>:
  9           0 BUILD_LIST               0
              2 LOAD_FAST                0 (.0)
        >>    4 FOR_ITER                12 (to 18)
              6 STORE_FAST               1 (char)
              8 LOAD_GLOBAL              0 (ord)
             10 LOAD_FAST                1 (char)
             12 CALL_FUNCTION            1
             14 LIST_APPEND              2
             16 JUMP_ABSOLUTE            4
        >>   18 RETURN_VALUE
```
#### Python
```python
key_list = [ord(char) for char in key_str]
```
#### Explanation
[List comprehensions](https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions) are treated as a function declaration. The "function" is pushed to the stack, followed by its "argument" (the thing to be iterated over). When the "function" is popped, so is its "argument", then the function is called with said argument, and the result is pushed to the stack. 

- `FOR_ITER` iterates over the argument
- `STORE_FAST 1 (char)` pops a `char` variable to the stack for each iteration
- `LOAD_GLOBAL 0 (ord)` pushes the `ord` function to the stack
- `LOAD_FAST 1 (char)` pushes the `char` variable to the stack
- `CALL_FUNCTION` invokes `ord` on `char` (i.e. `ord(char)`), pushing the result to the stack
- `LIST_APPEND`, as the name suggests, pops the value from the stack and adds it to a list
- `JUMP_ABSOLUTE 4` jumps back to offset 4 to continue iteration with the next iterator
- `RETURN_VALUE` returns the top of the stack (the list)
### `while` loop
#### Bytecode
```

 11     >>  134 LOAD_NAME                3 (len)
            136 LOAD_NAME                2 (key_list)
            138 CALL_FUNCTION            1
            140 LOAD_NAME                3 (len)
            142 LOAD_NAME                0 (input_list)
            144 CALL_FUNCTION            1
            146 COMPARE_OP               0 (<)
            148 POP_JUMP_IF_FALSE      162

 12         150 LOAD_NAME                2 (key_list)
            152 LOAD_METHOD              4 (extend)
            154 LOAD_NAME                2 (key_list)
            156 CALL_METHOD              1
            158 POP_TOP
            160 JUMP_ABSOLUTE          134
```
#### Python
```python
while len(key_list) < len(input_list):  
       key_list.extend(key_list)
```
#### Explanation
Offset `134` is the entrypoint for a loop (as we'll see later).

By now it should be evident what the first part is doing: this checks if `len(key_list) < len(input_list)`. If this condition is true, the subsequent lines execute. Otherwise, control flow resumes at offset `162` (the next section).

If the condition is true, `key_list` is extended with itself, then `JUMP_ABSOLUTE` resumes control flow at offset `134`. This sounds a lot like a while loop, doesn't it?
### `result`
#### Bytecode
```
 15     >>  162 LOAD_CONST              38 (<code object <listcomp> at 0x7f5ef6665df0, file "snake.py", line 15>)
            164 LOAD_CONST              37 ('<listcomp>')
            166 MAKE_FUNCTION            0
            168 LOAD_NAME                5 (zip)
            170 LOAD_NAME                0 (input_list)
            172 LOAD_NAME                2 (key_list)
            174 CALL_FUNCTION            2
            176 GET_ITER
            178 CALL_FUNCTION            1
            180 STORE_NAME               6 (result)

...

Disassembly of <code object <listcomp> at 0x7f5ef6665df0, file "snake.py", line 15>:
 15           0 BUILD_LIST               0
              2 LOAD_FAST                0 (.0)
        >>    4 FOR_ITER                16 (to 22)
              6 UNPACK_SEQUENCE          2
              8 STORE_FAST               1 (a)
             10 STORE_FAST               2 (b)
             12 LOAD_FAST                1 (a)
             14 LOAD_FAST                2 (b)
             16 BINARY_XOR
             18 LIST_APPEND              2
             20 JUMP_ABSOLUTE            4
        >>   22 RETURN_VALUE
```
#### Python
```python
result = [a ^ b for a,b in zip(input_list, key_list)]
```
#### Explanation
This section starts at offset `162`, the instruction jumped to if the previous condition were false. 

Like [[#`key_list`]], this line makes use of list comprehension. Unlike [[#`key_list`]], however, there are a few other things going on: the list comprehension function is pushed to the stack, but so is, the `zip` function, and `input_list` and `key_list` values from earlier. The first `CALL_FUNCTION` executes `zip(input_list, key_list)`, then its result is passed as an argument to `<listcomp>`. That is, the result is `zip(input_list, key_list)` is what is being iterated over.

Within `<listcomp>` itself:
- `FOR_ITER` iterates over the argument (i.e. the elements in `zip(input_list, key_list)`)
- `UNPACK_SEQUENCE 2` pops the top of the stack into 2 (and exactly 2) individual values (i.e. the $i$th elements of `input_list` and `key_list`) and pushes each to the top of the stack
- The pair of `STORE_FAST` instructions pop from the stack into the variables `a` and `b`, respectively
- The pair of `LOAD_FAST` instructions push `a` and `b` to the stack
- `BINARY_XOR` pops `a` and `b` from the stack, XORs them, then pushes the result to the stack
- `LIST_APPEND` pops the XOR result from the stack and adds it to a list
- `JUMP_ABSOLUTE 4` jumps back to offset 4 to continue iteration with the next iterator
- `RETURN_VALUE` returns the top of the stack (the list)
### `result_text`
#### Bytecode
```

 18         182 LOAD_CONST              39 ('')
            184 LOAD_METHOD              7 (join)
            186 LOAD_NAME                8 (map)
            188 LOAD_NAME                9 (chr)
            190 LOAD_NAME                6 (result)
            192 CALL_FUNCTION            2
            194 CALL_METHOD              1
            196 STORE_NAME              10 (result_text)
            198 LOAD_CONST              40 (None)
            200 RETURN_VALUE
```
#### Python
```python
result_text = ''.join(map(chr, result))
```
#### Explanation
This one practically reads like Python, no? 
## Result
```python
input_list = [4, 54, 41, 0, 112, 32, 25, 49, 33, 3, 0, 0, 57, 32, 108, 23, 48, 4, 9, 70, 7, 110, 36, 8, 108, 7, 49, 10, 4, 86, 43, 108, 122, 14, 2, 71, 62, 115, 88, 78]  
key_str = "t_Jo3"  
key_list = [ord(char) for char in key_str]  
while len(key_list) < len(input_list):  
       key_list.extend(key_list)  
result = [a ^ b for a,b in zip(input_list, key_list)]  
result_text = ''.join(map(chr, result))  
print(result_text)
```
## Flag
`picoCTF{N0t_sO_coNfus1ng_sn@ke_30a13a97}`

[^os]: https://opensource.com/article/18/4/introduction-python-bytecode
[^so]: https://stackoverflow.com/a/19560286
