import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./react-BZJXY1be.js";import{t as n}from"./jsx-runtime-DeHZSEgm.js";import{a as r,t as i}from"./helpers-BumIgWzl.js";import{n as a,t as o}from"./TextInput-_6cRrGDK.js";import{i as s,n as c,r as l,t as u}from"./formControlStories-a7FHNGtE.js";var d,f,p,m,h,g,_,v,y,b,x,S,C;function w(){return(w=e((()=>{d=t(),a(),s(),i(),f=n(),{fn:p}=__STORYBOOK_MODULE_TEST__,m={title:`Form Controls/TextInput`,component:o,args:{"aria-label":`Project name`,placeholder:`my-project`,onChange:p()},argTypes:{status:{control:`inline-radio`,options:[``,`warning`,`error`]}},decorators:[r(400)],parameters:{docs:{description:{component:"TextInput on its own and inside `Form.Item`. On its own it is named by\n`aria-label` and, without `value`, keeps its own state, as antd's\ncontrols do. Inside an item, the item owns the label, the help text and the\nmessage, and supplies the value (src/formControls)."}}}},h={},g={render:function(e){let[t,n]=(0,d.useState)(`my-project`);return(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(o,{...e,value:t,onChange:e=>n(e)}),(0,f.jsx)(l,{value:t})]})}},_={render:e=>(0,f.jsx)(c,{render:t=>(0,f.jsx)(o,{...e,"aria-label":`Project name (${t})`,status:t})})},v={args:{disabled:!0}},y={render:()=>(0,f.jsx)(u,{label:`Project name`,children:(0,f.jsx)(o,{placeholder:`my-project`})})},b={render:()=>(0,f.jsx)(u,{label:`Project name`,initialValue:`my-project`,children:(0,f.jsx)(o,{placeholder:`my-project`})})},x={render:()=>(0,f.jsx)(u,{label:`Project name`,validateTrigger:`onBlur`,children:(0,f.jsx)(o,{placeholder:`my-project`})})},S={render:()=>(0,f.jsx)(u,{label:`Project name`,disabled:!0,initialValue:`my-project`,children:(0,f.jsx)(o,{placeholder:`my-project`})})},C=[`Default`,`Controlled`,`Statuses`,`Disabled`,`InFormItem`,`InFormItemWithValue`,`ValidateOnBlur`,`FormDisabled`],h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{}`,...h.parameters?.docs?.source},description:{story:"On its own and uncontrolled: no `value`, so it keeps what the user enters.",...h.parameters?.docs?.description}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: function Render(args) {
    const [value, setValue] = useState<string | undefined>("my-project");
    return <>
        <TextInput {...args} value={value} onChange={next => setValue(next)} />
        <ValueReadout value={value} />
      </>;
  }
}`,...g.parameters?.docs?.source},description:{story:"On its own and controlled, through `value` and `onChange`.",...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:"{\n  render: args => <StatusesDemo render={status => <TextInput {...args} aria-label={`Project name (${status})`} status={status} />} />\n}",..._.parameters?.docs?.source},description:{story:"On its own with a border status, antd's `status`: no message.",..._.parameters?.docs?.description}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true
  }
}`,...v.parameters?.docs?.source},description:{story:`On its own, disabled.`,...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <FormItemDemo label="Project name">
      <TextInput placeholder="my-project" />
    </FormItemDemo>
}`,...y.parameters?.docs?.source},description:{story:"Inside a `Form.Item`: the item's label names the control, and a required\nrule shows its one message when the form is submitted empty.",...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <FormItemDemo label="Project name" initialValue={"my-project"}>
      <TextInput placeholder="my-project" />
    </FormItemDemo>
}`,...b.parameters?.docs?.source},description:{story:"Inside a `Form.Item`, starting from the form's `initialValues`. Reset puts\nthe value back.",...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <FormItemDemo label="Project name" validateTrigger="onBlur">
      <TextInput placeholder="my-project" />
    </FormItemDemo>
}`,...x.parameters?.docs?.source},description:{story:'Inside a `Form.Item` that validates when focus leaves the control\n(`validateTrigger="onBlur"`), not while it is edited: empty the field,\nthen move focus away to see the message. `InFormItem` validates on change.',...x.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <FormItemDemo label="Project name" disabled initialValue={"my-project"}>
      <TextInput placeholder="my-project" />
    </FormItemDemo>
}`,...S.parameters?.docs?.source},description:{story:"Inside a disabled form: `<Form disabled>` disables the control.",...S.parameters?.docs?.description}}}})))()}w();export{g as Controlled,h as Default,v as Disabled,S as FormDisabled,y as InFormItem,b as InFormItemWithValue,_ as Statuses,x as ValidateOnBlur,C as __namedExportsOrder,m as default};