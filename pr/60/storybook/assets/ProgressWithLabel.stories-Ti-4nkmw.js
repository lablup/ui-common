import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";import{n,t as r}from"./Text-CKq1rOCy.js";function i({label:e,valueLabel:t,value:n,hasValueLabel:i=!0,color:o,width:s,size:c=`sm`,className:l,style:u,labelStyle:d}){let f=n===void 0||Number.isNaN(n),p=!n||Number.isNaN(n)?0:Math.min(n,100),m=typeof s==`number`||typeof s==`string`;return(0,a.jsxs)(`div`,{className:[`uic-progress-with-label`,`uic-progress-with-label--${c}`,!m&&`uic-progress-with-label--grow`,l].filter(Boolean).join(` `),style:{...m?{width:s}:null,...u},children:[(0,a.jsx)(`div`,{className:`uic-progress-with-label__fill`,style:{width:`${p}%`,...o?{backgroundColor:o}:null}}),(0,a.jsxs)(`div`,{className:`uic-progress-with-label__labels`,children:[(0,a.jsx)(r,{className:`uic-progress-with-label__text`,style:d,children:e}),(0,a.jsx)(r,{className:`uic-progress-with-label__text uic-progress-with-label__value`,color:f?`disabled`:void 0,style:d,children:i?t:` `})]})]})}var a;function o(){return(o=e((()=>{n(),a=t(),i.displayName=`ProgressWithLabel`;try{i.displayName=`ProgressWithLabel`,i.__docgenInfo={description:``,displayName:`ProgressWithLabel`,filePath:`/home/runner/work/ui-common/ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,methods:[],props:{label:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`}],description:`Start label, usually what is measured.`,name:`label`,parent:{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`},required:!1,tags:{},type:{name:`ReactNode`}},valueLabel:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`}],description:`End label, usually the amount.`,name:`valueLabel`,parent:{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`},required:!1,tags:{},type:{name:`ReactNode`}},value:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`}],description:`Fill, in percent. Values above 100 fill the bar.`,name:`value`,parent:{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`},required:!1,tags:{},type:{name:`number`}},hasValueLabel:{defaultValue:{value:`true`},declarations:[{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`}],description:`Whether the end label shows. Its space stays reserved. Default: true`,name:`hasValueLabel`,parent:{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`},required:!1,tags:{},type:{name:`boolean`}},color:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`}],description:"Fill colour: any CSS colour or `var()`.",name:`color`,parent:{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`},required:!1,tags:{},type:{name:`string`}},width:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`}],description:`Width of the bar. Without it the bar grows to fill its flex container.`,name:`width`,parent:{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`},required:!1,tags:{},type:{name:`Width<string | number>`}},size:{defaultValue:{value:`sm`},declarations:[{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`}],description:`Label size. Default: "sm"`,name:`size`,parent:{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`},required:!1,tags:{},type:{name:`enum`,raw:`"sm" | "md" | "lg"`,value:[{value:`"sm"`},{value:`"md"`},{value:`"lg"`}]}},className:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`}],description:``,name:`className`,parent:{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`},required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`}],description:`Inline style of the frame.`,name:`style`,parent:{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`},required:!1,tags:{},type:{name:`CSSProperties`}},labelStyle:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`}],description:`Inline style of both labels.`,name:`labelStyle`,parent:{fileName:`ui-common/src/components/ProgressWithLabel/ProgressWithLabel.tsx`,name:`ProgressWithLabelProps`},required:!1,tags:{},type:{name:`CSSProperties`}}},tags:{}}}catch{}})))()}var s,c,l,u,d,f,p,m,h,g;function _(){return(_=e((()=>{o(),s=t(),c={title:`Components/ProgressWithLabel`,component:i,args:{label:`CPU`,valueLabel:`3 / 8 cores`,value:37.5,width:220},argTypes:{size:{control:`inline-radio`,options:[`sm`,`md`,`lg`]}}},l={},u={render:e=>(0,s.jsx)(`div`,{style:{display:`grid`,gap:12},children:[`sm`,`md`,`lg`].map(t=>(0,s.jsx)(i,{...e,size:t},t))})},d={args:{label:`Memory`,valueLabel:`58 / 64 GiB`,value:90.6,color:`var(--color-warning)`}},f={args:{label:`GPU`,valueLabel:`-`,value:void 0}},p={args:{label:`Storage`,valueLabel:`12 / 8 TiB`,value:150}},m={args:{hasValueLabel:!1}},h={args:{width:void 0},render:e=>(0,s.jsx)(`div`,{style:{display:`flex`,maxWidth:480},children:(0,s.jsx)(i,{...e})})},g=[`Default`,`Sizes`,`CustomColor`,`MissingValue`,`OverFull`,`WithoutValueLabel`,`FillsContainer`],l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: args => <div style={{
    display: "grid",
    gap: 12
  }}>
      {(["sm", "md", "lg"] as const).map(size => <ProgressWithLabel key={size} {...args} size={size} />)}
    </div>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Memory",
    valueLabel: "58 / 64 GiB",
    value: 90.6,
    color: "var(--color-warning)"
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    label: "GPU",
    valueLabel: "-",
    value: undefined
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Storage",
    valueLabel: "12 / 8 TiB",
    value: 150
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    hasValueLabel: false
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    width: undefined
  },
  render: args => <div style={{
    display: "flex",
    maxWidth: 480
  }}>
      <ProgressWithLabel {...args} />
    </div>
}`,...h.parameters?.docs?.source}}}})))()}_();export{d as CustomColor,l as Default,h as FillsContainer,f as MissingValue,p as OverFull,u as Sizes,m as WithoutValueLabel,g as __namedExportsOrder,c as default};