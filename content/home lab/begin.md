---
title: humble beginning
date: 2024-07-22
---
## Motivation
As I grow more comfortable with technology, I grow less comfortable with the idea of letting someone else manage my data. Naturally, I want to control my data myself! And with the means to do so, it was only a matter of time before I caved in and bought a little server to tinker around with. 
## Prologue
I originally planned on using a Raspberry Pi 5 to begin my home lab journey. The small but mighty RasPi can handle just about everything I want it to, occupies very little space, and draws a negligible amount of power. It seems like the perfect way to start a home lab. The only off putting aspect is price; it's just a bit more money than I wanted to spend. As a result, I decided against getting one until I had good reason to.
## The Start
Without good reason, I was recently browsing VarageSale (a local buy/sell platform), and noticed a Lenovo ThinkCentre m710e SFF for sale. I recall, at one point, browsing Lenovo's "tiny" offerings as a buffed-up alternative to a RasPi, but was worried about cooling issues since everything is crammed into a tiny case with little airflow. The SFF version, however, has a bigger fan and more airflow, so less concern there. 

This machine was listed with the factory specs: "an Intel Core i5 processor, 8GB of RAM, and a 256GB solid-state drive". The seller didn't mention which i5 offering was installed, so, as you do, I asked. A few hours later, I received the following messages:

![[homelab_cpu.png]]

I expected them to just turn it on and check using the GUI, but I guess this works too. With this information, I now figured I was getting a machine with the below spec sheet:

![[Pasted image 20240722120033.png]]

This is quite sufficient for my needs, and for $80, it seemed like a decent deal, so I bought it.

Seeing as it's a used machine and the original owner had already broken the seal of the thermal paste, I decided to disassemble everything, clean it out, reapply some thermal paste, and reassemble. Upon opening the case, I was greeted by this:

![[homelab_ssd.png]]

That's not the 256GB SSD I was promised! But I'm not complaining either! I was planning on putting a 2TB HDD in anyways, so this was a nice surprise. 

Underneath the drive tray lies the original M2 SSD and RAM slots. After removing the tray, and getting a better look at the RAM, I found that the RAM had been upgraded as well! Instead of the factory 8GB, it has 16GB (2x8GB). Score!

![[homelab_ram.png]]

After blowing out a metric fuckton of dust, I used a microfibre cloth and some rubbing alcohol to clean off the thermal paste from the CPU and cooler, reapplied using the trusty 5-dot method, and stuck everything back together. I also affixed the SSD to the drive bay using some extra bolts I had laying around since it was loosely flopping around there previously. 

Then I plugged it in, booted it up, and double checked that everything worked. However, upon start, I was not greeted with a factory fresh Windows install as expected. No, I was automatically signed in to the previous owner's account. I reached out to the previous owner and informed them that:
1. All of their files were still on the computer
2. No authentication of any kind was required to access these files
3. I would be formatting the drives without touching any of the files (to hopefully give them some peace of mind)

Let this be a reminder to use all to **always** wipe drives before selling them. Or better yet, take them out and smash them with a hammer until they're nothing but shards and dust of metal and plastic. 

Anyways, after formatting the drives, I created a Debian install disk, and began the install. I chose Debian because it's familiar (I use Ubuntu as my daily driver), but also because it's simple, stable, and secure. Even though I'm primarily going to be accessing the lab via terminal, I installed KDE Plasma as the desktop environment, and oh is it pretty. I guess it'll be something nice to look at whenever I do actually use the GUI. Here's the obligatory neofetch screenshot. 

![[homelab_rice.png]]

Now that everything is set up, all that's left is to actually start tinkering!
## What's Next
I have a few plans for this machine:
1. Break free from Google Drive by hosting my own NAS
2. Run an AdGuard Home instance for network-wide ad and tracker blocking
3. Set up a media server
4. Host a VPN for accessing my home network on the go
5. Playing around and learning networking and security

I plan on adding updates in this folder, maybe sharing things I learn along the way.