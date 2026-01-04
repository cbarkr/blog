---
title: "part 1: hardware"
tags:
  - blog
  - homelab
date: 2024-08-11
---
## Original plan
I originally planned on using a Raspberry Pi 5 to begin my home lab journey. The small but mighty RasPi can handle just about everything I want it to, occupies very little space, and draws a negligible amount of power. It seems like the perfect way to start a home lab. The only off putting aspect is price; it's just a bit more money than I wanted to spend. As a result, I decided against getting one until I had good reason to.
## New plan
Without good reason, I was recently browsing VarageSale (a local buy/sell platform), and noticed a Lenovo ThinkCentre m710e SFF for sale. I recall, at one point, browsing Lenovo's "tiny" offerings as a buffed-up alternative to a RasPi, but was worried about cooling issues since everything is crammed into a tiny case with little airflow. The SFF version, however, has a bigger fan and more airflow, so less concern there. 

This machine was listed with the factory specs: "an Intel Core i5 processor, 8GB of RAM, and a 256GB solid-state drive". The seller didn't mention which i5 offering was installed, so I asked. A few hours later, I received the following messages:

![[cpu.png]]

I expected them to just turn it on and check using the GUI, but I guess this works too. With this information, I now figured I was getting a machine with the below spec sheet:

![[specs.png]]

This is quite sufficient for my needs, and for $80, it seemed like a decent deal, so I bought it.

Seeing as it's a used machine and the original owner had already broken the seal of the thermal paste, I decided to disassemble everything, clean it out, reapply some thermal paste, and reassemble. Upon opening the case, I was greeted by this:

![[ssd.png]]

That's not the 256GB SSD I was promised! But I'm not complaining either! I was planning on putting a 2TB HDD in anyways, so this was a nice surprise. 

Underneath the drive tray lies the original M2 SSD and RAM slots. After removing the tray, and getting a better look at the RAM, I found that the RAM had been upgraded as well! Instead of the factory 8GB, it has 16GB (2x8GB). Score!

![[ram.png]]

After blowing out a metric fuckton of dust, I used a microfibre cloth and some rubbing alcohol to clean off the thermal paste from the CPU and cooler, reapplied using the trusty 5-dot method, and stuck everything back together. I also affixed the SSD to the drive bay using some extra bolts I had laying around since it was loosely flopping around there previously. 

Then I plugged it in, booted it up, and double checked that everything worked. However, upon start, I was not greeted with a factory fresh Windows install as expected. No, I was automatically signed in to the previous owner's account. I reached out to the previous owner and informed them that:
1. All of their files were still on the computer
2. No authentication of any kind was required to access these files
3. I would be formatting the drives without touching any of the files (to hopefully give them some peace of mind)

Let this be a reminder to use all to **always** wipe drives before selling them. Or better yet, take them out and smash them with a hammer until they're nothing but shards and dust of metal and plastic. Since I wanted to use these drives, I didn't choose the former option, but I did make sure to format everything. 

Next I had to decide what to put on the bare metal. While I could have gone the route of Proxmox, I preferred the idea of using a vanilla Linux distro for the sake of learning. I was split between Debian and Fedora, but ultimately chose Debian for its stability and familiarity (as I formerly used Ubuntu as a daily driver). I also installed a desktop environment (KDE) since I figured it might be nice sometimes. Obligatory `neofetch` + `htop`:

![[rice.png]]

For a GUI, however, I planned to primarily use Cockpit. This will be the focus of the next installation of this series. 

---

| Previous                    | Next       |
| --------------------------- | ---------- |
| [[homelab/v1/index\|index]] | [[part 2]] |
