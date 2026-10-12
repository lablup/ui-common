import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./react-BZJXY1be.js";import{t as n}from"./jsx-runtime-DeHZSEgm.js";import{i as r,n as i,r as a,t as o}from"./Modal-BBc3-f9w.js";import{n as s,t as c}from"./Text-CKq1rOCy.js";import{n as l,t as u}from"./Button-C3DljJ1j.js";import{i as d,n as f,t as p}from"./helpers-BumIgWzl.js";var m,h,g,_,v,y,b,x,S,C,w,T,E,D;function O(){return(O=e((()=>{m=t(),l(),s(),i(),r(),p(),h=n(),{fn:g}=__STORYBOOK_MODULE_TEST__,_={title:`Components/Modal`,component:o,subcomponents:{ModalHeader:a},args:{isOpen:!0,onOpenChange:g(),title:`Rename folder`,onAction:g(),actionLabel:`Rename`,children:(0,h.jsx)(c,{children:`The new name applies to every member of the project.`})},argTypes:{children:{control:!1},footer:{control:!1},variant:{control:`inline-radio`,options:[`standard`,`fullscreen`]},purpose:{control:`inline-radio`,options:[`info`,`form`,`required`]},actionVariant:{control:`select`,options:[`primary`,`secondary`,`ghost`,`destructive`]}},parameters:f(`400px`),render:function(e){let[t,n]=d(e.isOpen,e.onOpenChange);return(0,h.jsxs)(h.Fragment,{children:[(0,h.jsx)(u,{label:`Open modal`,onClick:()=>n(!0)}),(0,h.jsx)(o,{...e,isOpen:t,onOpenChange:n})]})}},v={},y={args:{subtitle:`Folder names must be unique within the project.`}},b={args:{isLoading:!0,isActionDisabled:!0}},x={args:{isActionLoading:!0}},S={args:{title:`About this folder`,onAction:void 0,actionLabel:void 0,children:(0,h.jsx)(c,{children:`Created three days ago. 1.2 GB in 48 files.`})}},C={args:{onAction:void 0,actionLabel:void 0,footer:(0,h.jsx)(c,{color:`secondary`,children:`Changes save automatically.`})}},w={args:{title:void 0,onAction:void 0,actionLabel:void 0,children:(0,h.jsx)(`div`,{style:{padding:24},children:(0,h.jsx)(c,{children:`Everything inside is the caller's own layout.`})})}},T={render:function(e){let[t,n]=d(e.isOpen,e.onOpenChange);return(0,h.jsxs)(h.Fragment,{children:[(0,h.jsx)(u,{label:`Open modal`,onClick:()=>n(!0)}),(0,h.jsxs)(o,{isOpen:t,onOpenChange:n,children:[(0,h.jsx)(a,{title:`Folder details`,subtitle:`Read only`,onOpenChange:n}),(0,h.jsx)(`div`,{style:{padding:24},children:(0,h.jsx)(c,{children:`Created three days ago. 1.2 GB in 48 files.`})})]})]})}},E={render:function(e){let[t,n]=(0,m.useState)(!1),[r,i]=d(e.isOpen,e.onOpenChange);return(0,h.jsxs)(h.Fragment,{children:[(0,h.jsx)(u,{label:`Open modal`,onClick:()=>i(!0)}),(0,h.jsxs)(o,{isOpen:r,onOpenChange:i,title:`Project settings`,footer:null,children:[(0,h.jsx)(u,{label:`Open nested modal`,onClick:()=>n(!0)}),(0,h.jsx)(o,{isOpen:t,onOpenChange:n,title:`Confirm change`,actionLabel:`Apply`,onAction:()=>n(!1),children:(0,h.jsx)(c,{children:`Apply the new settings to every folder?`})})]})]})}},D=[`Default`,`WithSubtitle`,`Loading`,`ActionLoading`,`WithoutFooter`,`CustomFooter`,`Bare`,`Header`,`Nested`],v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    subtitle: "Folder names must be unique within the project."
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    isLoading: true,
    isActionDisabled: true
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    isActionLoading: true
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    title: "About this folder",
    onAction: undefined,
    actionLabel: undefined,
    children: <Text>Created three days ago. 1.2 GB in 48 files.</Text>
  }
}`,...S.parameters?.docs?.source},description:{story:"Without `onAction` or `footer` there is no footer; closing is the header's job.",...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    onAction: undefined,
    actionLabel: undefined,
    footer: <Text color="secondary">Changes save automatically.</Text>
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    title: undefined,
    onAction: undefined,
    actionLabel: undefined,
    children: <div style={{
      padding: 24
    }}>
        <Text>Everything inside is the caller&apos;s own layout.</Text>
      </div>
  }
}`,...w.parameters?.docs?.source},description:{story:"Without `title`, `onAction` or `footer`, `children` is the whole surface.",...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: function Render(args) {
    const [isOpen, setOpen] = useOpenState(args.isOpen, args.onOpenChange);
    return <>
        <Button label="Open modal" onClick={() => setOpen(true)} />
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
          <ModalHeader title="Folder details" subtitle="Read only" onOpenChange={setOpen} />
          <div style={{
          padding: 24
        }}>
            <Text>Created three days ago. 1.2 GB in 48 files.</Text>
          </div>
        </Modal>
      </>;
  }
}`,...T.parameters?.docs?.source},description:{story:"`ModalHeader` builds a header by hand, for a surface without the generated one.",...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: function Render(args) {
    const [isInnerOpen, setIsInnerOpen] = useState(false);
    const [isOpen, setOpen] = useOpenState(args.isOpen, args.onOpenChange);
    return <>
        <Button label="Open modal" onClick={() => setOpen(true)} />
        <Modal isOpen={isOpen} onOpenChange={setOpen} title="Project settings" footer={null}>
          <Button label="Open nested modal" onClick={() => setIsInnerOpen(true)} />
          <Modal isOpen={isInnerOpen} onOpenChange={setIsInnerOpen} title="Confirm change" actionLabel="Apply" onAction={() => setIsInnerOpen(false)}>
            <Text>Apply the new settings to every folder?</Text>
          </Modal>
        </Modal>
      </>;
  }
}`,...E.parameters?.docs?.source},description:{story:`A modal opened from inside another paints above it and takes Escape.`,...E.parameters?.docs?.description}}}})))()}O();export{x as ActionLoading,w as Bare,C as CustomFooter,v as Default,T as Header,b as Loading,E as Nested,y as WithSubtitle,S as WithoutFooter,D as __namedExportsOrder,_ as default};