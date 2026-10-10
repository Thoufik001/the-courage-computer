// Applied directly to the CRT glass so the room keeps its flat cartoon palette.
export const crtVertex = `
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec3 p = position;
  p.z += .085 * (1. - pow((uv.x - .5) * 2., 2.)) * (1. - pow((uv.y - .5) * 2., 2.));
  vWorld=(modelMatrix*vec4(p,1.)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
export const crtFragment = `
uniform sampler2D map;
uniform float time;
uniform float pulse;
uniform float powerTime;
uniform float powered;uniform float lamp;uniform vec3 eye;
varying vec2 vUv;varying vec3 vWorld;
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453); }
void main() {
  vec2 q = vUv - .5;
  vec2 uv = .5 + q * (1. + .018 * dot(q,q));
  uv.x += sin(uv.y * 38. + time * 30.) * .0009 * pulse;
  vec2 glassEdge = abs(q * 2.);
  if (glassEdge.x > 1.-.057*glassEdge.y*glassEdge.y ||
      glassEdge.y > 1.-.0498*glassEdge.x*glassEdge.x) discard;
  vec4 c = texture2D(map, uv);
  // Gentle phosphor diffusion; the lettering remains a single thin stroke.
  vec3 halo = texture2D(map, uv + vec2(.001,0.)).rgb
            + texture2D(map, uv - vec2(.001,0.)).rgb
            + texture2D(map, uv + vec2(0.,.001)).rgb
            + texture2D(map, uv - vec2(0.,.001)).rgb;
  c.rgb = mix(c.rgb, halo * .25, .16);
  float scan = .97 + .03 * sin(uv.y * 888. * 3.14159265);
  float grain = (hash(gl_FragCoord.xy + floor(time * 12.)) - .5) * .004;
  float flicker = 1. + .0025 * sin(time * 47.) + .0015 * sin(time * 71.);
  float sweepY = 1. - fract(time * .085);
  float roll = 1. + .035 * exp(-pow((uv.y - sweepY) * 24., 2.)) - .014 * exp(-pow((uv.y - sweepY + .035) * 45., 2.));
  float mask = .997 + .003 * sin(gl_FragCoord.x * 2.094);
  c.rgb = c.rgb * scan * flicker * roll * mask + grain;
  float letters = smoothstep(.48,.72,c.r);
  c.rgb *= 1. + letters * .20;
  vec3 blackGlass=vec3(.002,.004,.003);
  if(powered<.5) {
    float t=powerTime;
    c.rgb=blackGlass;
    if(t<.20) {
      float height=mix(1.,.005,smoothstep(0.,.20,t));
      vec2 folded=vec2(uv.x,.5+(uv.y-.5)/height);
      float inside=1.-smoothstep(height*.5,height*.5+.002,abs(uv.y-.5));
      vec3 image=texture2D(map,folded).rgb;
      c.rgb+=mix(image,vec3(.85,1.,.92),smoothstep(.08,.20,t))*inside;
    } else if(t<.38) {
      float width=mix(.48,.003,smoothstep(.20,.38,t));
      float beam=exp(-pow((uv.y-.5)/.0035,2.))*(1.-smoothstep(width,width+.015,abs(uv.x-.5)));
      c.rgb+=vec3(.85,1.,.92)*beam;
    } else if(t<.80) {
      float dotGlow=exp(-dot(q*vec2(140.,110.),q*vec2(140.,110.)));
      c.rgb+=vec3(.85,1.,.92)*dotGlow*exp(-(t-.38)*13.);
    }
  } else {
    // Warm up from black; no collapse flash on initial page load.
    c.rgb=mix(blackGlass,c.rgb,smoothstep(.05,.48,powerTime));
  }
  // Curved glass reflects a broad room window and the actual desk lamp.
  vec3 normal=normalize(vec3(q.x*.35,q.y*.35,1.));
  vec3 viewDir=normalize(eye-vWorld);
  vec3 reflected=reflect(-viewDir,normal);
  vec2 r=reflected.xy/max(.4,abs(reflected.z));
  vec2 windowUV=(r-vec2(-.42,.30))/vec2(.27,.36);
  float window=exp(-pow(abs(windowUV.x),8.)-pow(abs(windowUV.y),8.));
  float mullion=1.-.72*exp(-pow(windowUV.x*20.,2.));
  float fresnel=.025+.16*pow(1.-max(0.,dot(viewDir,normal)),3.);
  c.rgb+=vec3(.82,.94,.91)*window*mullion*(.075+fresnel);
  vec3 lampDirection=normalize(vec3(-2.56,3.83,.15)-vWorld);
  vec3 halfDir=normalize(lampDirection+viewDir);
  float lampGlint=pow(max(0.,dot(normal,halfDir)),48.);
  c.rgb+=vec3(1.,.80,.42)*lampGlint*.16*lamp;
  c.rgb+=vec3(.22,.36,.32)*fresnel;

  // Narrow elliptical arcs, open toward the center of the glass.
  vec2 glareUv=vUv;
  vec2 topP=(glareUv-vec2(.145,.73))/vec2(.105,.225);
  float topAngle=atan(topP.y,topP.x);
  float topBand=1.-smoothstep(.035,.105,abs(length(topP)-1.));
  float topEnds=smoothstep(1.67,1.82,topAngle)*(1.-smoothstep(3.0,3.14,topAngle));
  float topGlare=topBand*topEnds;
  vec2 opposite=1.-glareUv;
  vec2 bottomP=(opposite-vec2(.145,.785))/vec2(.105,.15);
  float bottomAngle=atan(bottomP.y,bottomP.x);
  float bottomBand=1.-smoothstep(.035,.11,abs(length(bottomP)-1.));
  float bottomEnds=smoothstep(1.65,1.83,bottomAngle)*(1.-smoothstep(3.0,3.14,bottomAngle));
  float bottomGlare=bottomBand*bottomEnds;
  c.rgb=mix(c.rgb,vec3(.91,1.,.96),clamp(topGlare+bottomGlare,0.,1.)*mix(.018,.17,powered));
  gl_FragColor = c;
  #include <colorspace_fragment>
}`;
