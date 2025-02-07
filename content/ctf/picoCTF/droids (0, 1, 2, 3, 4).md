---
title: "picoCTF 2019: droids (0, 1, 2, 3, 4)"
tags:
  - blog
  - ctf
date: 2025-02-03
---
# droids0
## Problem
![[description0.png]]
## Solution
Given the APK, I first unpacked it and did some naive searching (as in [[Mob psycho]]) with no luck. I guess I should see what the app does first. After booting up an emulator, I installed the APK and launched the app. It asks but one simple question: "were else can output go?", the answer to which is "Logcat". 

![[flag0.png]]

After inputting the answer and clicking the button, the flag is printed to Logcat.

![[droid0log.png]]
### Flag
`picoCTF{a.moose.once.bit.my.sister}`
# droids1
## Problem
![[media/ctf/picoCTF/droids/description1.png]]
## Solution
For this challenge, I thought I'd try out Android Studio's "Profile or debug APK" functionality. It turns out the APK was built with debugging enabled so all debug symbols were preserved. 

Taking a look at the strings, I noticed the following entry:

![[droid1string.png]]
![[droid1string2.png]]

That looks interesting! Let's try it: 

![[flag1.png]]
### Flag
`picoCTF{pining.for.the.fjords}`
# droids2
## Problem
![[media/ctf/picoCTF/droids/description2.png]]
## Solution 
Given the APK `two.apk`, I first decoded it using `apktool d two.apk`, which produced a `two` directory. After poking around a bit, I found `FlagstaffHill.smali` located in `two/smali/com/hellocmu/picoctf` which seemed promising. Within it is a `getFlag` function that builds a string, presumably the password. I'll spare you the eyesore of the Smali code, and instead show you the equivalent Java code (from [decompiler.com](https://www.decompiler.com/) for convenience and formatted by hand for readability): 

```java
public static String getFlag(String input, Context ctx) {
	String[] witches = {"weatherwax", "ogg", "garlick", "nitt", "aching", "dismass"};
	int second = 3 - 3;
	int third = (3 / 3) + second;
	int fourth = (third + third) - second;
	int fifth = 3 + fourth;
	if (
		input.equals(""
			.concat(witches[fifth])
			.concat(".")
			.concat(witches[third])
			.concat(".")
			.concat(witches[second])
			.concat(".")
			.concat(witches[(fifth + second) - third])
			.concat(".")
			.concat(witches[3])
			.concat(".")
			.concat(witches[fourth])
		)
	) {
		return sesame(input);
	}
```

By making a few small changes to this code, we can print out the password:

```java
public class TwoSol {
	public static void main(String args[]) {
		String[] witches = {"weatherwax", "ogg", "garlick", "nitt", "aching", "dismass"};
		int second = 3 - 3;
		int third = (3 / 3) + second;
		int fourth = (third + third) - second;
		int fifth = 3 + fourth;
		String password = ""
			.concat(witches[fifth])
			.concat(".")
			.concat(witches[third])
			.concat(".")
			.concat(witches[second])
			.concat(".")
			.concat(witches[(fifth + second) - third])
			.concat(".")
			.concat(witches[3])
			.concat(".")
			.concat(witches[fourth]);
		System.out.printf("%s\n", password);
	}
}
```

Running `java TwoSol.java` outputs `dismass.ogg.weatherwax.aching.nitt.garlick`, which, if input into the app, gets the flag!

![[flag2.png]]
### Flag
`picoCTF{what.is.your.favourite.colour}`
# droids3
## Problem
![[media/ctf/picoCTF/droids/description3.png]]
## Solution
Once again, I decoded using `apktool d three.apk`, took a look at the `getFlag` method in `three/smali/com/hellocmu/picoctf/FlagstaffHill.smali`. It is quite short and simple:

```smali
.method public static getFlag(Ljava/lang/String;Landroid/content/Context;)Ljava/lang/String;
    .locals 1
	.param p0, "input"    # Ljava/lang/String;
    .param p1, "ctx"    # Landroid/content/Context;

    .line 19
    invoke-static {p0}, Lcom/hellocmu/picoctf/FlagstaffHill;->nope(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    .line 20
    .local v0, "flag":Ljava/lang/String;
    return-object v0
.end method

.method public static nope(Ljava/lang/String;)Ljava/lang/String;
    .locals 1
    .param p0, "input"    # Ljava/lang/String;

    .line 11
    const-string v0, "don\'t wanna"

    return-object v0
.end method

.method public static yep(Ljava/lang/String;)Ljava/lang/String;
    .locals 1
    .param p0, "input"    # Ljava/lang/String;

    .line 15
    invoke-static {p0}, Lcom/hellocmu/picoctf/FlagstaffHill;->cilantro(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method
```

Line 19 in `getFlag` is of note:

```smali
invoke-static {p0}, Lcom/hellocmu/picoctf/FlagstaffHill;->nope(Ljava/lang/String;)Ljava/lang/String;
```

In this line, the `nope` method is invoked with the value in `p0` as a parameter, and its result is stored in register `v0`. By replacing `nope` with `yep`, `yep` will be invoked instead, thereby running the `cilantro` native, thus returning the flag. 

```smali
invoke-static {p0}, Lcom/hellocmu/picoctf/FlagstaffHill;->yep(Ljava/lang/String;)Ljava/lang/String;
```

After making this change, I rebuilt the APK using `apktool b three`, which outputs to `three/dist/three.apk`. 

Before installing the app on the emulator, it must be signed. First, I created a new keystore file using:

```bash
keytool -genkey -v -keystore mykeystore -keyalg RSA -keysize 2048 -validity 1  
0000
```

Then signed the new APK using this keystore file:

```bash
apksigner sign --ks mykeystore --v1-signing-enabled true --v2-signing-enabled  
true three/dist/three.apk
```

Installing the modified app on the emulator, any input will be accepted and print the flag.

![[flag3.png]]
### Flag
`picoCTF{tis.but.a.scratch}`
# droids4
## Problem
![[media/ctf/picoCTF/droids/description4.png]]
## Solution
This is the final boss. It's basically just a combination of [[#droids2]] and [[#droids3]] so nothing too crazy. 

Decoding the APK and inspecting `four/smali/com/hellocmu/picoctf/FlagstaffHill.smali`, I noticed that a native method `cardamom` is defined:

```smali
.method public static native cardamom(Ljava/lang/String;)Ljava/lang/String;
.end method
```

This method is what actually outputs the flag. However, running `cat four/smali/com/hellocmu/picoctf/FlagstaffHill.smali | grep cardamom` returns only one result: the above definition. Let's change that! 

Here is the most relevant part of `getFlag` for our purposes here:

```smali
.line 36
.local v4, "password":Ljava/lang/String;
invoke-virtual {p0, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

move-result v5

if-eqz v5, :cond_0

const-string v5, "call it"

return-object v5

.line 37
:cond_0
const-string v5, "NOPE"

return-object v5
```

The authors of this problem want us to replace the line `const-string v5, "call it"` with our call to `cardamom`. Assuming `cardamom` independently checks the input against the password, I'll play nice and not try to bypass the password check by replacing the "NOPE" condition. The following snippet calls `cardamom`, passing the value in `p0` as a parameter, stores the result in `v5`, then returns it.

```smali
invoke-static {p0}, Lcom/hellocmu/picoctf/FlagstaffHill;->cardamom(Ljava/lang/String;)Ljava/lang/String;
move-result-object v5

return-object v5
```

The snippet from before then becomes:

```smali
.line 36
.local v4, "password":Ljava/lang/String;
invoke-virtual {p0, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

move-result v5

if-eqz v5, :cond_0

invoke-static {p0}, Lcom/hellocmu/picoctf/FlagstaffHill;->cardamom(Ljava/lang/String;)Ljava/lang/String;
move-result-object v5

return-object v5

.line 37
:cond_0
const-string v5, "NOPE"

return-object v5
```

As in [[#droids3]], the APK is rebuilt using `apktool b four`, then signed using:

```bash
apksigner sign --ks mykeystore --v1-signing-enabled true --v2-signing-enabled  
true four/dist/four.apk
```

Now for the password. Like [[#droids2]], let's drop the APK into [decompiler.com](https://www.decompiler.com):

```java
public static String getFlag(String input, Context ctx) {
	StringBuilder ace = new StringBuilder("aaa");
	StringBuilder jack = new StringBuilder("aaa");
	StringBuilder queen = new StringBuilder("aaa");
	StringBuilder king = new StringBuilder("aaa");
	ace.setCharAt(0, (char) (ace.charAt(0) + 4));
	ace.setCharAt(1, (char) (ace.charAt(1) + 19));
	ace.setCharAt(2, (char) (ace.charAt(2) + 18));
	jack.setCharAt(0, (char) (jack.charAt(0) + 7));
	jack.setCharAt(1, (char) (jack.charAt(1) + 0));
	jack.setCharAt(2, (char) (jack.charAt(2) + 1));
	queen.setCharAt(0, (char) (queen.charAt(0) + 0));
	queen.setCharAt(1, (char) (queen.charAt(1) + 11));
	queen.setCharAt(2, (char) (queen.charAt(2) + 15));
	king.setCharAt(0, (char) (king.charAt(0) + 14));
	king.setCharAt(1, (char) (king.charAt(1) + 20));
	king.setCharAt(2, (char) (king.charAt(2) + 15));
	if (
		input.equals(""
		.concat(queen.toString())
		.concat(jack.toString())
		.concat(ace.toString())
		.concat(king.toString())
		)
	) {
		return cardamom(input);
	}
	return "NOPE";
}
```

And reverse the password checking:

```java
public class FourSol {
	public static void main(String args[]) {
		StringBuilder ace = new StringBuilder("aaa");
		StringBuilder jack = new StringBuilder("aaa");
		StringBuilder queen = new StringBuilder("aaa");
		StringBuilder king = new StringBuilder("aaa");
		ace.setCharAt(0, (char) (ace.charAt(0) + 4));
		ace.setCharAt(1, (char) (ace.charAt(1) + 19));
		ace.setCharAt(2, (char) (ace.charAt(2) + 18));
		jack.setCharAt(0, (char) (jack.charAt(0) + 7));
		jack.setCharAt(1, (char) (jack.charAt(1) + 0));
		jack.setCharAt(2, (char) (jack.charAt(2) + 1));
		queen.setCharAt(0, (char) (queen.charAt(0) + 0));
		queen.setCharAt(1, (char) (queen.charAt(1) + 11));
		queen.setCharAt(2, (char) (queen.charAt(2) + 15));
		king.setCharAt(0, (char) (king.charAt(0) + 14));
		king.setCharAt(1, (char) (king.charAt(1) + 20));
		king.setCharAt(2, (char) (king.charAt(2) + 15));
		String password = ""
			.concat(queen.toString())
			.concat(jack.toString())
			.concat(ace.toString())
			.concat(king.toString());
		System.out.printf("%s\n", password);
	}
}
```

This outputs `alphabetsoup`. Checking with our new APK, we see:

![[flag4.png]]
### Flag
`picoCTF{not.particularly.silly}`