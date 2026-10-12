import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./react-BZJXY1be.js";import{t as n}from"./jsx-runtime-DeHZSEgm.js";import{n as r,t as i}from"./NumberInput-BYjAN9kI.js";import{a,t as o}from"./helpers-BumIgWzl.js";import{a as s,i as c,n as l,o as u,r as d,s as f,t as p}from"./StepNumberInput-CUubQZA2.js";function m(e){let[t,n]=(0,g.useState)(e.value??e.steps[0]??0);return(0,_.jsx)(p,{...e,value:t,onChange:t=>{n(t),e.onChange?.(t)}})}function h(){let e=[1,2,4,8,16,32,64,128],[t,n]=(0,g.useState)(8);return(0,_.jsxs)(u,{label:`Batch size`,children:[(0,_.jsx)(i,{label:`Batch size`,isLabelHidden:!0,value:t,onChange:n,width:`100%`}),(0,_.jsx)(d,{onStep:r=>{let i=c(e,t??0,r),a=e[i];a!==void 0&&n(a)}})]})}var g,_,v,y,b,x,S,C,w,T;function E(){return(E=e((()=>{g=t(),f(),r(),s(),l(),o(),_=n(),{fn:v}=__STORYBOOK_MODULE_TEST__,y=[.25,.5,1,2,4,8,16],b={title:`Components/StepNumberInput`,component:p,subcomponents:{NumberStepper:d},args:{label:`Shared memory`,steps:y,value:1,units:`GiB`,onChange:v()},decorators:[a(240)],render:e=>(0,_.jsx)(m,{...e})},x={},S={args:{min:.5,max:8,value:2}},C={args:{isDisabled:!0}},w={render:()=>(0,_.jsx)(h,{})},T=[`Default`,`WithMinMax`,`Disabled`,`Stepper`],x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    min: 0.5,
    max: 8,
    value: 2
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    isDisabled: true
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <PowerOfTwoField />
}`,...w.parameters?.docs?.source}}}})))()}E();export{x as Default,C as Disabled,w as Stepper,S as WithMinMax,T as __namedExportsOrder,b as default};