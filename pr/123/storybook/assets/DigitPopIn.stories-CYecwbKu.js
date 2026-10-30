import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./react-BZJXY1be.js";import{t as n}from"./jsx-runtime-DeHZSEgm.js";import{n as r,t as i}from"./Button-B8YrxcF_.js";import{n as a,t as o}from"./DigitPopIn-BqAxCzv1.js";function s(){let[e,t]=(0,c.useState)(0);return(0,l.jsxs)(`div`,{style:{display:`flex`,gap:12,alignItems:`center`},children:[(0,l.jsx)(o,{text:p[e]??``}),(0,l.jsx)(i,{label:`Next value`,onClick:()=>t(e=>(e+1)%p.length)})]})}var c,l,u,d,f,p,m,h;function g(){return(g=e((()=>{c=t(),r(),a(),l=n(),u={title:`Components/DigitPopIn`,component:o,args:{text:`1,234`}},d={},f={render:()=>(0,l.jsx)(`div`,{style:{display:`grid`,gap:8},children:[`42`,`98.5%`,`1,048,576`,`3 / 4`].map(e=>(0,l.jsx)(o,{text:e},e))})},p=[`1,234`,`5,678`,`98.5%`,`12`,`3 / 4`],m={render:()=>(0,l.jsx)(s,{})},h=[`Default`,`Formats`,`Replay`],d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "grid",
    gap: 8
  }}>
      {["42", "98.5%", "1,048,576", "3 / 4"].map(text => <DigitPopIn key={text} text={text} />)}
    </div>
}`,...f.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <ReplayDemo />
}`,...m.parameters?.docs?.source}}}})))()}g();export{d as Default,f as Formats,m as Replay,h as __namedExportsOrder,u as default};