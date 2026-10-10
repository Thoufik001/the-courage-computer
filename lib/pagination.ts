import italianno from 'tegaki/fonts/italianno';

const SIZE=35;
const MAX_LINES=9;
const glyphs=italianno.glyphData as Record<string,{w:number}>;

function measure(text:string){
 return Array.from(text).reduce((width,ch)=>width+((glyphs[ch]?.w??(ch===' '?250:600))/italianno.unitsPerEm*SIZE),0);
}

/** Only commit streamed text through a completed word or punctuation mark. */
export function completeWordBoundary(text:string){
 let end=0;
 for(let i=0;i<text.length;i++)if(/\s|[.,!?;:]/u.test(text[i]))end=i+1;
 return end;
}

/** Lay out whole words before drawing; hyphenate only words wider than a line. */
export function paginate(text:string,_hand:'user'|'memory',width=388){
 const pages:string[]=[];
 let current='',lineWidth=0,line=0,pendingSpace='';
 const nextLine=()=>{
  current=current.trimEnd();
  if(line===MAX_LINES-1){pages.push(current);current='';line=0;}
  else{current+='\n';line++;}
  lineWidth=0;
 };
 const append=(value:string)=>{current+=value;lineWidth+=measure(value);};
 for(const token of text.match(/\n|[^\S\n]+|[^\s]+/gu)??[]){
  if(token==='\n'){pendingSpace='';nextLine();continue;}
  if(/^\s+$/u.test(token)){pendingSpace+=token;continue;}
  const wordWidth=measure(token);
  if(wordWidth<=width){
   const space=lineWidth?pendingSpace:'';
   if(lineWidth&&lineWidth+measure(space)+wordWidth>width)nextLine();
   else if(space)append(space);
   append(token);pendingSpace='';continue;
  }
  // A word that cannot fit even on an empty line is the sole hyphenation case.
  if(lineWidth)nextLine();
  pendingSpace='';
  const letters=Array.from(token);
  while(letters.length){
   let part='';
   while(letters.length){
    const candidate=part+letters[0];
    const suffix=letters.length>1?'-':'';
    if(part&&measure(candidate+suffix)>width)break;
    part=candidate;letters.shift();
   }
   append(part);
   if(letters.length){append('-');nextLine();}
  }
 }
 if(current||!pages.length)pages.push(current.trimEnd());
 return pages;
}
