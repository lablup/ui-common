import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";import{n,t as r}from"./useUicTranslator-DooeRDdv.js";import{n as i,t as a}from"./Token-B6QfP_NV.js";function o({value:e,trueLabel:t,falseLabel:r,fallback:i=`-`}){let o=n();return typeof e==`boolean`?e?(0,s.jsx)(a,{color:`green`,label:t??o(`uic.BooleanToken.true`)}):(0,s.jsx)(a,{color:`default`,label:r??o(`uic.BooleanToken.false`)}):i}var s;function c(){return(c=e((()=>{i(),r(),s=t(),o.displayName=`BooleanToken`;try{o.displayName=`BooleanToken`,o.__docgenInfo={description:``,displayName:`BooleanToken`,filePath:`/home/runner/work/ui-common/ui-common/src/components/BooleanToken/BooleanToken.tsx`,methods:[],props:{value:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/BooleanToken/BooleanToken.tsx`,name:`BooleanTokenProps`}],description:"The value. Anything but a boolean renders `fallback`.",name:`value`,parent:{fileName:`ui-common/src/components/BooleanToken/BooleanToken.tsx`,name:`BooleanTokenProps`},required:!0,tags:{},type:{name:`boolean | null | undefined`}},trueLabel:{defaultValue:{value:`the catalog's uic.BooleanToken.true ("True")`},declarations:[{fileName:`ui-common/src/components/BooleanToken/BooleanToken.tsx`,name:`BooleanTokenProps`}],description:"Label for `true`.",name:`trueLabel`,parent:{fileName:`ui-common/src/components/BooleanToken/BooleanToken.tsx`,name:`BooleanTokenProps`},required:!1,tags:{default:`the catalog's uic.BooleanToken.true ("True")`},type:{name:`string`}},falseLabel:{defaultValue:{value:`the catalog's uic.BooleanToken.false ("False")`},declarations:[{fileName:`ui-common/src/components/BooleanToken/BooleanToken.tsx`,name:`BooleanTokenProps`}],description:"Label for `false`.",name:`falseLabel`,parent:{fileName:`ui-common/src/components/BooleanToken/BooleanToken.tsx`,name:`BooleanTokenProps`},required:!1,tags:{default:`the catalog's uic.BooleanToken.false ("False")`},type:{name:`string`}},fallback:{defaultValue:{value:`-`},declarations:[{fileName:`ui-common/src/components/BooleanToken/BooleanToken.tsx`,name:`BooleanTokenProps`}],description:"Rendered when `value` is not a boolean.",name:`fallback`,parent:{fileName:`ui-common/src/components/BooleanToken/BooleanToken.tsx`,name:`BooleanTokenProps`},required:!1,tags:{default:`"-"`},type:{name:`ReactNode`}}},tags:{}}}catch{}})))()}var l,u,d,f,p,m,h;function g(){return(g=e((()=>{c(),l=t(),u={title:`Components/BooleanToken`,component:o,args:{value:!0}},d={},f={render:e=>(0,l.jsxs)(`div`,{style:{display:`flex`,gap:12,alignItems:`center`},children:[(0,l.jsx)(o,{...e,value:!0}),(0,l.jsx)(o,{...e,value:!1}),(0,l.jsx)(o,{...e,value:null})]})},p={render:e=>(0,l.jsxs)(`div`,{style:{display:`flex`,gap:12,alignItems:`center`},children:[(0,l.jsx)(o,{...e,value:!0,trueLabel:`Enabled`,falseLabel:`Disabled`}),(0,l.jsx)(o,{...e,value:!1,trueLabel:`Enabled`,falseLabel:`Disabled`})]})},m={args:{value:null,fallback:`Not set`}},h=[`Default`,`Values`,`CustomLabels`,`CustomFallback`],d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: args => <div style={{
    display: "flex",
    gap: 12,
    alignItems: "center"
  }}>
      <BooleanToken {...args} value={true} />
      <BooleanToken {...args} value={false} />
      <BooleanToken {...args} value={null} />
    </div>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: args => <div style={{
    display: "flex",
    gap: 12,
    alignItems: "center"
  }}>
      <BooleanToken {...args} value={true} trueLabel="Enabled" falseLabel="Disabled" />
      <BooleanToken {...args} value={false} trueLabel="Enabled" falseLabel="Disabled" />
    </div>
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    value: null,
    fallback: "Not set"
  }
}`,...m.parameters?.docs?.source}}}})))()}g();export{m as CustomFallback,p as CustomLabels,d as Default,f as Values,h as __namedExportsOrder,u as default};