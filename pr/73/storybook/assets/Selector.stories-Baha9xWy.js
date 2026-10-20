import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./react-BZJXY1be.js";import{t as n}from"./jsx-runtime-DeHZSEgm.js";import{a as r,t as i}from"./helpers-BumIgWzl.js";import{n as a,t as o}from"./Selector-B08e5Lqs.js";import{i as s,n as c,r as l,t as u}from"./formControlStories-NgMfexbv.js";var d,f,p,m,h,g,_,v,y,b,x,S,C,w;function T(){return(T=e((()=>{d=t(),a(),s(),i(),f=n(),{fn:p}=__STORYBOOK_MODULE_TEST__,m=[{value:`north`,label:`North`},{value:`south`,label:`South`}],h={title:`Form Controls/Selector`,component:o,args:{"aria-label":`Region`,options:m,placeholder:`Select a region`,onChange:p()},argTypes:{status:{control:`inline-radio`,options:[``,`warning`,`error`]}},decorators:[r(400)],parameters:{docs:{description:{component:"Selector on its own and inside `Form.Item`. On its own it is named by\n`aria-label` and, without `value`, keeps its own state, as antd's\ncontrols do. Inside an item, the item owns the label, the help text and the\nmessage, and supplies the value (src/formControls)."}}}},g={},_={render:function(e){let[t,n]=(0,d.useState)(`north`);return(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(o,{...e,value:t,onChange:e=>n(e)}),(0,f.jsx)(l,{value:t})]})}},v={render:e=>(0,f.jsx)(c,{render:t=>(0,f.jsx)(o,{...e,"aria-label":`Region (${t})`,status:t})})},y={args:{disabled:!0}},b={render:()=>(0,f.jsx)(u,{label:`Region`,children:(0,f.jsx)(o,{options:m,placeholder:`Select a region`})})},x={render:()=>(0,f.jsx)(u,{label:`Region`,initialValue:`north`,children:(0,f.jsx)(o,{options:m,placeholder:`Select a region`})})},S={render:()=>(0,f.jsx)(u,{label:`Region`,validateTrigger:`onBlur`,children:(0,f.jsx)(o,{options:m,placeholder:`Select a region`})})},C={render:()=>(0,f.jsx)(u,{label:`Region`,disabled:!0,initialValue:`north`,children:(0,f.jsx)(o,{options:m,placeholder:`Select a region`})})},w=[`Default`,`Controlled`,`Statuses`,`Disabled`,`InFormItem`,`InFormItemWithValue`,`ValidateOnBlur`,`FormDisabled`],g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{}`,...g.parameters?.docs?.source},description:{story:"On its own and uncontrolled: no `value`, so it keeps what the user enters.",...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: function Render(args) {
    const [value, setValue] = useState<string | undefined>("north");
    return <>
        <Selector {...args} value={value} onChange={next => setValue(next)} />
        <ValueReadout value={value} />
      </>;
  }
}`,..._.parameters?.docs?.source},description:{story:"On its own and controlled, through `value` and `onChange`.",..._.parameters?.docs?.description}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:"{\n  render: args => <StatusesDemo render={status => <Selector {...args} aria-label={`Region (${status})`} status={status} />} />\n}",...v.parameters?.docs?.source},description:{story:"On its own with a border status, antd's `status`: no message.",...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true
  }
}`,...y.parameters?.docs?.source},description:{story:`On its own, disabled.`,...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <FormItemDemo label="Region">
      <Selector options={OPTIONS} placeholder="Select a region" />
    </FormItemDemo>
}`,...b.parameters?.docs?.source},description:{story:"Inside a `Form.Item`: the item's label names the control, and a required\nrule shows its one message when the form is submitted empty.",...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <FormItemDemo label="Region" initialValue={"north"}>
      <Selector options={OPTIONS} placeholder="Select a region" />
    </FormItemDemo>
}`,...x.parameters?.docs?.source},description:{story:"Inside a `Form.Item`, starting from the form's `initialValues`. Reset puts\nthe value back.",...x.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <FormItemDemo label="Region" validateTrigger="onBlur">
      <Selector options={OPTIONS} placeholder="Select a region" />
    </FormItemDemo>
}`,...S.parameters?.docs?.source},description:{story:'Inside a `Form.Item` that validates when focus leaves the control\n(`validateTrigger="onBlur"`), not while it is edited: empty the field,\nthen move focus away to see the message. `InFormItem` validates on change.',...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => <FormItemDemo label="Region" disabled initialValue={"north"}>
      <Selector options={OPTIONS} placeholder="Select a region" />
    </FormItemDemo>
}`,...C.parameters?.docs?.source},description:{story:"Inside a disabled form: `<Form disabled>` disables the control.",...C.parameters?.docs?.description}}}})))()}T();export{_ as Controlled,g as Default,y as Disabled,C as FormDisabled,b as InFormItem,x as InFormItemWithValue,v as Statuses,S as ValidateOnBlur,w as __namedExportsOrder,h as default};