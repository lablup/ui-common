import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./react-BZJXY1be.js";import{t as n}from"./jsx-runtime-DeHZSEgm.js";import{n as r,t as i}from"./Button-C3DljJ1j.js";import{n as a,t as o}from"./ComplexSelector-DpHBEOoH.js";function s({value:e,onSelect:t}){return(0,u.jsx)(`div`,{style:{display:`grid`,gap:4,padding:8},children:Object.keys(f).map(n=>(0,u.jsx)(i,{"aria-pressed":n===e,variant:n===e?`primary`:`ghost`,label:`${f[n].name}: ${f[n].detail}`,onClick:()=>t(n)},n))})}function c(e){let[t,n]=(0,l.useState)(e.value);return(0,u.jsx)(o,{...e,value:t,triggerLabel:t?f[t].name:void 0,onChange:t=>{n(t),e.onChange?.(t)},onClear:e.onClear&&(()=>{n(void 0),e.onClear?.()})})}var l,u,d,f,p,m,h,g,_,v,y,b,x,S;function C(){return(C=e((()=>{l=t(),r(),a(),u=n(),{fn:d}=__STORYBOOK_MODULE_TEST__,f={starter:{name:`Starter`,detail:`2 vCPU, 4 GiB memory`},team:{name:`Team`,detail:`8 vCPU, 32 GiB memory`},enterprise:{name:`Enterprise`,detail:`32 vCPU, 128 GiB memory`}},p={title:`Forks/ComplexSelector`,component:o,args:{label:`Plan`,value:`team`,placeholder:`Choose a plan`,width:280,onChange:d(),onOpenChange:d(),children:(e,t,n)=>(0,u.jsx)(s,{value:e,onSelect:e=>{t(e),n()}})},argTypes:{size:{control:`inline-radio`,options:[`sm`,`md`,`lg`]},variant:{control:`inline-radio`,options:[`input`,`ghost`]}},render:e=>(0,u.jsx)(c,{...e})},m={},h={args:{hasClear:!0,onClear:d()}},g={args:{hasClear:!0}},_={args:{hasClear:!0,onClear:d(),isLoading:!0}},v={args:{value:void 0,hasClear:!0}},y={args:{isDisabled:!0,hasClear:!0}},b={args:{description:`Billed monthly.`,status:{type:`error`,message:`This plan is not available in your region.`}}},x={args:{variant:`ghost`,size:`sm`,isLabelHidden:!0}},S=[`Default`,`WithClear`,`WithClearFallback`,`WithClearWhileLoading`,`Placeholder`,`Disabled`,`WithStatus`,`Ghost`],m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    hasClear: true,
    onClear: fn()
  }
}`,...h.parameters?.docs?.source},description:{story:"The fork's addition: `hasClear` shows a clear button while a value is\nshown. It calls `onClear`, and does not open the surface.",...h.parameters?.docs?.description}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    hasClear: true
  }
}`,...g.parameters?.docs?.source},description:{story:"Without `onClear`, the clear button calls `onChange(undefined)`.",...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    hasClear: true,
    onClear: fn(),
    isLoading: true
  }
}`,..._.parameters?.docs?.source},description:{story:`The clear button sits between the loading spinner and the chevron.`,..._.parameters?.docs?.description}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    value: undefined,
    hasClear: true
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    isDisabled: true,
    hasClear: true
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    description: "Billed monthly.",
    status: {
      type: "error",
      message: "This plan is not available in your region."
    }
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    variant: "ghost",
    size: "sm",
    isLabelHidden: true
  }
}`,...x.parameters?.docs?.source}}}})))()}C();export{m as Default,y as Disabled,x as Ghost,v as Placeholder,h as WithClear,g as WithClearFallback,_ as WithClearWhileLoading,b as WithStatus,S as __namedExportsOrder,p as default};