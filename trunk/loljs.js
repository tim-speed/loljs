/*
 * Copyright <2010> <Mark Watkinson>. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY <Mark Watkinson> ``AS IS'' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <Mark Watkinson> OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those of the
authors and should not be interpreted as representing official policies, either expressed
or implied, of <Mark Watkinson>.
*/



/* loljs.js: a LOLCODE to JavaScript translator
 * 
 * usage note:
 * you have to define your own 'puts' function to display stdout. This should look something like:
 * function puts(string, newline)
 * { 
 *      document.getElementById('stdout').innerHTML += string + ((newline==true)? '<br>' : ''); 
 * }
 */

/*
 * Instructions:
 * call loljs(your_lol_code)
 * then eval() the return
 */


/* 
 * TODO: "any of"/"all of" operators,
 * operator precedence may not be right, or (as I suspect) in the instance that there is no defined 'right', sensible.
 * 
 * array support (BUKKIT)
 */



// keep a list of user defined functions so we know when to 'link' calls to them.
var lolspace_user_def_func_names = [];


// Simple substitutions in the form array( regex, sub, regex2, sub2, ...)

var lolspace_ASSIGNMENT = [
  'I HAS A ([a-zA-Z0-9_]+) IT[SZ] (.*)', 'var $1 = $2',
  'I HAS A ([a-zA-Z0-9_]+)', 'var $1 = null',
  '([a-zA-Z0-9_]+) R (.*)', '$1=$2'  
]
  
var lolspace_OTHER = [
  'VISIBLE (.*)!\s*$', 'puts($1, false)',    
  'VISIBLE (.*)', 'puts($1)',    
  '(G[EI]MMEH ([a-zA-Z0-9_]+))', '$2=prompt("$1")',
  'WIN', 'true',
  'FAIL', 'false',
  'FOUND [UY]R (.*)', 'return $1',
  'CAN HAS .*', ''
  
]

  var lolspace_CONTROL = [
  'O RLY\\?', '',
  'YA RLY', 'if(IT){',
  'NO WAI', '}else{',
  'MEBBE (.*)', '}else if($1){',
  'OIC', '}',

  'UPPIN YR ([a-zA-Z0-9_]+)', '$1+1 YR $1',
  'NERFIN YR ([a-zA-Z0-9_]+)', '$1-1 YR $1',

  'IM IN YR [a-zA-Z0-9_]+ (.*) YR ([a-zA-Z0-9]+) TIL (.*)', 'for( ; !($3); $2=$1){',
  'IM IN YR [a-zA-Z0-9_]+ (.*) YR ([a-zA-Z0-9]+) WILE (.*)', 'for( ; $3; $2=$1){',
  'IM IN YR [a-zA-Z0-9_]+', 'while(1){',
  

  'IM OUTTA YR .*', '}',  
  'GTFO', 'break;',
  
  '\s*(.*?)\s*WTF\\?', 'switch($1){',
  'OMG (.*)', 'case $1:',
  'OMGWTF', 'default:',
  
  'IF U SAY SO', 'return IT;}',
  'IZ (.*)', 'if($1){',
  'KTHX$', '}'

  ]
  
  // these should probably be bracketed for precedence, although i'm not sure and the spec doesn't really clear things
  // up
  var lolspace_MATH_OPS = [
  'SUM OF ([^\\s]+) AN (.*)', '$1+$2',
  'DIFF OF ([^\\s]+) AN (.*)', '$1-$2',
  'PRODUKT OF ([^\\s]+) AN (.*)', '$1*$2',
  'MOD OF ([^\\s]+) AN (.*)', '$1%$2',
  'QUOSHUNT OF ([^\\s]+) AN (.*)', '$1/$2',
  'BIGGR OF ([^\\s]+) AN (.*)', 'Math.max($1,$2)',
  'SMALLR OF ([^\\s]+) AN (.*)', 'Math.min($1,$2)',
  
  'UP[Z]? ([a-zA-Z0-9_]+)!*(\\d+)$', '$1+=$2',
  'UP[Z]? ([a-zA-Z0-9_])!*', '$1++',
  '(\\w+) BIG[G]?[E]?R THAN (.*?)\\?', '$1>$2',
  '(\\w+) SMAL[L]?[E]?R THAN (.*?)\\?', '$1<$2'
  ]

  var lolspace_LOGIC_OPS = [
   'BOTH OF ([^\\s]+) AN (.*)', '$1&&($2)',
   'EITHER OF ([^\\s]+) AN (.*)', '$1||($2)',
   'WON OF ([^\\s]+) AN (.*)', '$1||($2)&&!($1&&($2))',
   'NOT (.*)', '!($1)',
   'BOTH SAEM ([a-zA-Z0-9_]+) AN (.*)', '$1==($2)',
   'DIFFRINT ([^\\s]+) AN (.*)', '$1!=($2)'
  ]
  





function lolspace_sub_func_def(str)
{
  if (str.indexOf('HOW DUZ I') == -1)
    return str;
  var s = str.replace(/^\s+/g, '').split(' ');
  
  var func_name = s[3];
  lolspace_user_def_func_names.push(func_name);
  var arg_list = [];
  for (var i=4; i<s.length; i++)
  {
    if (s[i] != 'YR' && s[i] != 'AN')
      arg_list.push(s[i]);
  }
  return 'function ' + func_name + '(' + arg_list.join(',') + '){';
}

function lolspace_sub_func_call(str)
{
  for (var i=0; i<lolspace_user_def_func_names.length; i++)
  {
    var fn = lolspace_user_def_func_names[i];
    var x = str.indexOf(fn);
    if (x == -1)
      continue;
    
    var callstr = str.substr(x);
    callstr = callstr.split(/[ ]+/g);
    var rep = callstr[0] + '(';
    rep += callstr.slice(1).join(',') + ')';
    str = str.substr(0, x) + rep;
  }
  return str;
}


function lolspace_sub_other(str)
{  
  var a = lolspace_OTHER;
  for (var i=0; i<a.length; i+=2)
    str = str.replace(new RegExp(a[i], 'g'), a[i+1]);
  return str;
}

function lolspace_sub_control(str)
{
  var a = lolspace_CONTROL;
  for (var i=0; i<a.length; i+=2)
    str = str.replace(new RegExp(a[i], ''), a[i+1]);
  return str;
}

function lolspace_sub_assignment(str)
{
  var str1 = new String(str);
  for (var i=0; i<lolspace_ASSIGNMENT.length; i+=2)
    str1 = str1.replace(new RegExp(lolspace_ASSIGNMENT[i]), lolspace_ASSIGNMENT[i+1]);
  
  return str1;
  
}

function lolspace_sub_ops(str, IT)
{
  var str1 = new String(str);
  var last_str = new String(str);
  var ops = lolspace_MATH_OPS.concat(lolspace_LOGIC_OPS);
  var x = 0;
  while (1)
  {
    for (var i=0; i<ops.length; i+=2)
      str1 = str1.replace(new RegExp(ops[i], 'g'), ops[i+1]);
    if (str1 == last_str)
      break;
    last_str = new String(str1);
    x++
  }
  if (x && IT)
    str1 = 'var IT = ' + str1;
  return str1;
}


function lolspace_strip_comments(str)
{
  str = str.replace(/OBTW[\s\S]*?TLDR/g, '');
  str = str.replace(/BTW.*/g, '');
  return str;
}

function lolspace_sub_concat(str)
{
  if (str.indexOf('SMOOSH') == -1)
    return str;
  
  str = str.split(' ');
  var smooshing = false;
  var s = ""
  for (var i=0; i<str.length; i++)
  {
    if (smooshing)
    {
      if (str[i] == 'AN')
        continue;
      if (str[i] == 'MKAY')
      {
        smooshing = false;
        continue;
      }
      s += '+' + str[i];
    }    
    else
    {
      if (str[i] == 'SMOOSH')
      {
        s += " \"\"";
        smooshing = true;
      }
      else
        s += " " + str[i]
    }
    
  }
  
  return s;
  
}


function lolspace_sub_cast(str)
{
  var casts = ['TROOF', 'Boolean',
               'YARN', 'String',
               'NUMBR', 'parseInt',
               'NUMBAR', 'Number'];
  str = str.replace(/(.*) IS NOW A (.*)/g, '$1 R MAEK $1 A $2');
  
  if (str.indexOf('MAEK') == -1)
    return str;
                    
  for (var i=0; i<casts.length; i+=2)
  {
    var r = new RegExp('MAEK (.*) A ' + casts[i], 'g');
    str = str.replace(r, casts[i+1] + '($1)');
  }
  str = str.replace(/MAEK (.*) A NOOB/g, null);
  return str;

}


function lolspace_prepare(str)
{
  str = str.replace(/HAI.*/g, '');
  str = str.replace(/KTHXBYE.*/g, '');
  str = lolspace_strip_comments(str);
  
  
  
  str = str.replace(/[ \t]+/g, ' '); 
  
  str = str.replace(/,/g, '\n');
  
  str = str.replace(/\n[ ]*WTF\?/g, ' WTF?');
  str = str.replace(/\.{3}\s+\n/g, ''); 
  
  var s = str.split(/\r\n|\r|\n/);
  var s_ = []
  for (var i=0; i<s.length; i++)
  {
    var line = s[i].replace(/[ ]*$/, '');
    var trimmed = line.replace(/^[ ]+/, '');
    if (trimmed.length)
      s_.push(line);
  }
  return s_;
}



function loljs(str)
{
  lolspace_user_def_func_names = [];

  // the regexes all rely on values being single words, so we need
  // to alias the string literals.
  var aliases = [];
  var i = -1;
  var last_i = 0;
  var start;
  var in_str = false;
  var str_ = "";
  var num_alaises = 0;
  while ((i = str.indexOf('"', i+1)) !== -1)
  {
    if (!in_str)
    {
      str_ += str.substr(last_i, i-last_i);
      in_str = true;
      start = i;
    }
    else
    {
      var escapes = 0;
      var j=i-1;
      while (j>=0 && str[j] == '\\')
        escapes++;
      if (!(escapes % 2))
      {
        in_str = false;
        aliases[num_alaises] = str.substr(start+1, (i-start-1));
        str_ += '@' + num_alaises++;
        i++;
      }
    }
    last_i = i;
  }
  str_ += str.substr(last_i);
  
  
  var s = lolspace_prepare(str_);
  
  
  // now we sub in the javascript
  for (var i=0; i<s.length; i++)
  {
    var it = true;
    var assign = false;
    var control = false;
    var s__;
    var s_ = s[i];
    s_ = lolspace_sub_cast(s_);
    
    s_ = lolspace_sub_concat(s_);
    var ops = false
    s__ = s_;
    s_ = lolspace_sub_ops(s_, false);
    if (s_ != s__)
      ops = true;    
  
    s__ = s_;
    
    s_ = lolspace_sub_assignment(s_);
    
    if (s_ != s__)
      assign = true;
    
    s_ = lolspace_sub_other(s_);
    s__ = s_;
    
    s_ = lolspace_sub_control(s_);

    if (s_ != s__)
      control = true;
    
    it = !(control || assign);
    
    s_ = lolspace_sub_func_call(s_);

    
    var funcdef = false;
    s__ = s_;
    s_ = lolspace_sub_func_def(s_); 

    if (s_ != s__)
      funcdef = true;

    if (it && ops  && !s_.match(/return/))
      s_ = "var IT=" + s_;

    if (!control && !funcdef && !s_.match(/;.*$/) && !s_.match(/^\s*$/))
      s_ += ';';

    s[i] = s_;
  }

  var js = s.join("\n");
  
  //sub back the string literals
  for (var i=num_alaises-1; i>=0; i--)
    js = js.replace('@' + i, '"' + aliases[i] + '"');
  
  return js;
  
}
  
  
  
