import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";import{n,t as r}from"./copy-D6IMCqxC.js";import{n as i,t as a}from"./HStack-LbxorLrZ.js";import{n as o,t as s}from"./Token-CHil_66o.js";import{n as c,t as l}from"./TextHighlighter-CS4XWwO0.js";function u({values:e=[],highlightKeyword:t}){if(e.length===0)return null;let n=e.map(e=>typeof e==`string`?{label:e,color:`blue`}:e),r=t!==void 0;return(0,d.jsx)(a,{gap:0,align:`center`,className:`uic-double-token`,children:n.map((e,n)=>{if(!e.label)return null;let i=e.endContent===void 0?r?(0,d.jsx)(l,{keyword:t,children:e.label}):void 0:e.endContent;return(0,d.jsx)(s,{className:`uic-double-token__item`,color:e.color??`blue`,label:e.label,isLabelHidden:i!==void 0,endContent:i},n)})})}var d;function f(){return(f=e((()=>{i(),o(),c(),d=t(),u.displayName=`DoubleToken`;try{u.displayName=`DoubleToken`,u.__docgenInfo={description:``,displayName:`DoubleToken`,filePath:`/home/runner/work/ui-common/ui-common/src/components/DoubleToken/DoubleToken.tsx`,methods:[],props:{values:{defaultValue:{value:`[]`},declarations:[{fileName:`ui-common/src/components/DoubleToken/DoubleToken.tsx`,name:`DoubleTokenProps`}],description:`The tokens, in order.`,name:`values`,parent:{fileName:`ui-common/src/components/DoubleToken/DoubleToken.tsx`,name:`DoubleTokenProps`},required:!1,tags:{},type:{name:`(string | DoubleTokenValue)[]`}},highlightKeyword:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/DoubleToken/DoubleToken.tsx`,name:`DoubleTokenProps`}],description:`Marks this text in every label.`,name:`highlightKeyword`,parent:{fileName:`ui-common/src/components/DoubleToken/DoubleToken.tsx`,name:`DoubleTokenProps`},required:!1,tags:{},type:{name:`string`}}},tags:{}}}catch{}})))()}var p,m,h,g,_,v,y,b;function x(){return(x=e((()=>{n(),f(),p=t(),m={title:`Components/DoubleToken`,component:u,args:{values:[{label:`CUDA`,color:`green`},`12.4`]}},h={},g={render:()=>(0,p.jsx)(`div`,{style:{display:`grid`,gap:8,justifyItems:`start`},children:[`default`,`green`,`orange`,`purple`,`gray`].map(e=>(0,p.jsx)(u,{values:[{label:`Python`,color:e},`3.12`]},e))})},_={args:{values:[{label:`project`,color:`gray`},{label:`storage`,color:`purple`},`data`]}},v={args:{values:[{label:`Python`,color:`green`},`3.12`],highlightKeyword:`py`}},y={args:{values:[{label:`region`,color:`gray`},{label:`example-west-1`,endContent:(0,p.jsxs)(`span`,{style:{display:`inline-flex`,gap:4,alignItems:`center`},children:[`example-west-1`,(0,p.jsx)(r,{size:12,"aria-hidden":!0})]})}]}},b=[`Default`,`Colors`,`ThreeValues`,`HighlightKeyword`,`WithEndContent`],h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "grid",
    gap: 8,
    justifyItems: "start"
  }}>
      {(["default", "green", "orange", "purple", "gray"] as const).map(color => <DoubleToken key={color} values={[{
      label: "Python",
      color
    }, "3.12"]} />)}
    </div>
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    values: [{
      label: "project",
      color: "gray"
    }, {
      label: "storage",
      color: "purple"
    }, "data"]
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    values: [{
      label: "Python",
      color: "green"
    }, "3.12"],
    highlightKeyword: "py"
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    values: [{
      label: "region",
      color: "gray"
    }, {
      label: "example-west-1",
      endContent: <span style={{
        display: "inline-flex",
        gap: 4,
        alignItems: "center"
      }}>
            example-west-1
            <Copy size={12} aria-hidden />
          </span>
    }]
  }
}`,...y.parameters?.docs?.source}}}})))()}x();export{g as Colors,h as Default,v as HighlightKeyword,_ as ThreeValues,y as WithEndContent,b as __namedExportsOrder,m as default};