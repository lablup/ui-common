import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";import{n,t as r}from"./HStack-BBByr9KW.js";import{n as i,t as a}from"./Badge-Do63T4K2.js";function o({values:e=[]}){if(e.length===0)return null;let t=e.map(e=>typeof e==`string`?{label:e,variant:`neutral`}:e);return(0,s.jsx)(r,{gap:0,align:`center`,className:`uic-double-badge`,children:t.map((e,t)=>e.label?(0,s.jsx)(a,{className:`uic-double-badge__item`,variant:e.variant??`neutral`,label:e.label},t):null)})}var s;function c(){return(c=e((()=>{i(),n(),s=t(),o.displayName=`DoubleBadge`;try{o.displayName=`DoubleBadge`,o.__docgenInfo={description:``,displayName:`DoubleBadge`,filePath:`/home/runner/work/ui-common/ui-common/src/components/DoubleBadge/DoubleBadge.tsx`,methods:[],props:{values:{defaultValue:{value:`[]`},declarations:[{fileName:`ui-common/src/components/DoubleBadge/DoubleBadge.tsx`,name:`DoubleBadgeProps`}],description:`The badges, in order.`,name:`values`,parent:{fileName:`ui-common/src/components/DoubleBadge/DoubleBadge.tsx`,name:`DoubleBadgeProps`},required:!1,tags:{},type:{name:`(string | DoubleBadgeValue)[]`}}},tags:{}}}catch{}})))()}var l,u,d,f,p,m,h;function g(){return(g=e((()=>{c(),l=t(),u={title:`Components/DoubleBadge`,component:o,args:{values:[{label:`RUNNING`,variant:`success`},`2m`]}},d={},f={render:()=>(0,l.jsx)(`div`,{style:{display:`grid`,gap:8,justifyItems:`start`},children:[`neutral`,`info`,`success`,`warning`,`error`].map(e=>(0,l.jsx)(o,{values:[{label:e.toUpperCase(),variant:e},`5m`]},e))})},p={args:{values:[{label:`PENDING`,variant:`warning`},{label:`Queued`,variant:`info`},`12s`]}},m={args:{values:[`Draft`]}},h=[`Default`,`Variants`,`ThreeValues`,`Single`],d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "grid",
    gap: 8,
    justifyItems: "start"
  }}>
      {(["neutral", "info", "success", "warning", "error"] as const).map(variant => <DoubleBadge key={variant} values={[{
      label: variant.toUpperCase(),
      variant
    }, "5m"]} />)}
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    values: [{
      label: "PENDING",
      variant: "warning"
    }, {
      label: "Queued",
      variant: "info"
    }, "12s"]
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    values: ["Draft"]
  }
}`,...m.parameters?.docs?.source}}}})))()}g();export{d as Default,m as Single,p as ThreeValues,f as Variants,h as __namedExportsOrder,u as default};