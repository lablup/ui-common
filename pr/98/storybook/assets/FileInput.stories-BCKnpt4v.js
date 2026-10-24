import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";import{r as n,t as r}from"./helpers-BumIgWzl.js";import{n as i,t as a}from"./FileInput-CYxQkXlu.js";function o(e){let[t,r]=n(e.value??null);return(0,s.jsx)(a,{...e,value:t,onChange:t=>{r(t),e.onChange?.(t)}})}var s,c,l,u,d,f,p,m;function h(){return(h=e((()=>{i(),r(),s=t(),{fn:c}=__STORYBOOK_MODULE_TEST__,l={title:`Forks/FileInput`,component:a,args:{label:`Attachment`,value:null,onChange:c(),onBlur:c()},render:e=>(0,s.jsx)(o,{...e}),parameters:{docs:{description:{component:"The fork's fix: `aria-describedby` and the focus handlers reach the trigger\nbutton. `Hint` describes the trigger with a passed `aria-describedby`."}}}},u={},d={args:{isMultiple:!0,accept:`image/*`}},f={render:e=>(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(`p`,{id:`file-hint`,children:`PNG or JPEG, up to 5 MB.`}),(0,s.jsx)(o,{...e,"aria-describedby":`file-hint`})]})},p={args:{isDisabled:!0}},m=[`Default`,`Multiple`,`Hint`,`Disabled`],u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    isMultiple: true,
    accept: "image/*"
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: args => <>
      <p id="file-hint">PNG or JPEG, up to 5 MB.</p>
      <FileInputDemo {...args} aria-describedby="file-hint" />
    </>
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    isDisabled: true
  }
}`,...p.parameters?.docs?.source}}}})))()}h();export{u as Default,p as Disabled,f as Hint,d as Multiple,m as __namedExportsOrder,l as default};