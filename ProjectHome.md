i can has lolcode in my browser?

LOLCODE is a rather daft programming language with syntax styled after the grammatical syntax of LOLCats. This project provides a translator from LOLCODE into JavaScript so you can easily run it in your browser and use LOLCODE scripting on your web pages. Although why you'd wish to is another matter entirely.

1.0 was written in a few hours and 1.1 was rewritten in a day so don't expect wonders, but it runs a few nontrivial examples fine.



## Download ##
> `svn export http://loljs.googlecode.com/svn/trunk/ loljs`


## Example ##
**Interactive example!** click [here](http://www.asgaard.co.uk/misc/loljs)

A valid LOLCODE program to approximate pi looks something like the following. Note that comments are enclosed by either `BTW` (single line)  or `OBTW .. TLDR` (multi-line)

```
HAI
OBTW we are going to calculate Pi using an approximation 
algorithm, by evaluating the following sum:

 4 * SUM OF  [   (-1)^k            k ∈ N 
                  2*k + 1   ]

We shall evaluate 0 <= k < 10000
TLDR

I HAS A LIMIT ITZ 100000
I HAS A K ITZ 0
I HAS A PI_APPROXIMATION ITZ 0

IM IN YR LOOP UPPIN YR K WILE NOT BOTH SAEM K AN LIMIT
  I HAS A NUMERATOR
  I HAS A EVEN ITZ MOD OF K AN 2
  NOT EVEN, O RLY?
    YA RLY, NUMERATOR R 1
    NO WAI, NUMERATOR R -1
  OIC
  I HAS A DENOMINATOR ITZ PRODUKT OF 2 AN K
  DENOMINATOR R SUM OF DENOMINATOR AN 1
  I HAS A TERM ITZ QUOSHUNT OF NUMERATOR AN DENOMINATOR
  PI_APPROXIMATION R SUM OF PI_APPROXIMATION AN TERM
IM OUTTA YR LOOP
PI_APPROXIMATION R PRODUKT OF PI_APPROXIMATION AN 4
VISIBLE "PI IS ABOUT "!
VISIBLE PI_APPROXIMATION
KTHXBYE
```


> stdout: `PI IS ABOUT 3.1415826535897198`






# i can has usage instructions? #

include loljs.js into your page, and then, assuming your lolcode is in a string variable called 'lolcode':

```
  var js = loljs(lolcode);
  eval(js);
```

This sends stdout to annoying alert() boxes by default, so it's best to provide your own 'puts' function which should write it somewhere more convenient. Something like:

```
lolspace_set_puts(function(str, newline){
  var stdout = document.getElementById('stdout');
  str = str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
  stdout.innerHTML +=  str + ((newline !== false)? '<br>' : '');
});
```




Oblig. xkcd:



> ![http://imgs.xkcd.com/comics/in_ur_reality.png](http://imgs.xkcd.com/comics/in_ur_reality.png)


## Bugs ##

The comments/strings are stripped/aliased respectively by a few regular expressions, but if you have a comment delimiter inside a string or vice versa there's no guarantee it will work. This could be easily fixed but I don't have the time/inclination right now. If you want to, patches would be accepted.


## Other stuff ##

Shameless plug: if you want a syntax highlighter which can handle LOLCODE (for posting exciting LOLCODE on your blog, or whatever), check out my other project [Luminous, a server-side php syntax highlighter](http://luminous.asgaard.co.uk).