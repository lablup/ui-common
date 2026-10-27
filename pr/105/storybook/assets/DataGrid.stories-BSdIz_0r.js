import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./react-BZJXY1be.js";import{t as n}from"./jsx-runtime-DeHZSEgm.js";import{a as r,i,n as a,o,r as s,t as c}from"./DataGrid-nV9Q1wnt.js";import{n as l,t as u}from"./Button-l8m3QY8i.js";var d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H;function U(){return(U=e((()=>{d=t(),l(),a(),o(),i(),f=n(),{fn:p}=__STORYBOOK_MODULE_TEST__,m=[`Compute`,`Storage`,`Network`],h=[`Running`,`Stopped`,`Pending`],g=[`region-a`,`region-b`,`region-c`],_=e=>Array.from({length:e},(e,t)=>{let n=t+1;return{id:`res-${String(n).padStart(3,`0`)}`,name:`resource-${String(n).padStart(2,`0`)}`,kind:m[t%m.length],status:h[t*7%h.length],region:g[t*5%g.length],cpu:t*3%16+1,memoryGiB:2**(t%6+1),createdAt:new Date(Date.UTC(2026,0,1+t*11%90)).toISOString().slice(0,10)}}),v=_(30),y=_(240),b=e=>(t,n)=>t[e].localeCompare(n[e]),x=e=>(t,n)=>t[e]-n[e],S=[{key:`name`,header:`Name`,renderCell:e=>e.name,sortKey:`name`,compare:b(`name`),isAlwaysVisible:!0,exportKeys:[`name`]},{key:`kind`,header:`Kind`,renderCell:e=>e.kind,sortKey:`kind`,compare:b(`kind`),exportKeys:[`kind`]},{key:`status`,header:`Status`,renderCell:e=>e.status,sortKey:`status`,compare:b(`status`),exportKeys:[`status`]},{key:`region`,header:`Region`,renderCell:e=>e.region,exportKeys:[`region`]},{key:`cpu`,header:`CPU`,renderCell:e=>e.cpu,align:`end`,width:90,sortKey:`cpu`,compare:x(`cpu`),exportKeys:[`cpu`]},{key:`memory`,header:`Memory`,renderCell:e=>`${e.memoryGiB} GiB`,align:`end`,width:110,sortKey:`memory`,compare:x(`memoryGiB`),exportKeys:[`memory_gib`]},{key:`createdAt`,header:`Created`,renderCell:e=>e.createdAt,width:130,sortKey:`createdAt`,compare:b(`createdAt`),exportKeys:[`created_at`]}],C={title:`Components/DataGrid`,component:c,subcomponents:{DataGridSettingsModal:s,DataGridExportModal:r},args:{data:v,columns:S,idKey:`id`,onSortChange:p()}},w={},T={render:function(e){let[t,n]=(0,d.useState)({sortKey:`cpu`,direction:`descending`});return(0,f.jsx)(c,{...e,sort:t,onSortChange:t=>{e.onSortChange?.(t),n(t)}})}},E={render:function(e){let[t,n]=(0,d.useState)([`res-001`,`res-004`]);return(0,f.jsx)(c,{...e,selection:{selectedKeys:t,onChange:e=>n(e),getIsItemEnabled:e=>e.status!==`Pending`,getRowLabel:e=>e.name}})}},D={args:{isResizable:!0,columns:S.map(e=>({...e,width:e.width??160}))}},O={args:{isResizable:!1}},k={args:{scrollWidth:1400,columns:S.map(e=>e.key===`name`?{...e,pin:`start`,width:180}:e.key===`createdAt`?{...e,pin:`end`}:e)}},A={args:{pagination:!1,maxHeight:320}},j={args:{columns:S.map(e=>e.key===`cpu`||e.key===`memory`?{...e,groupHeader:`Allocation`}:e)}},M={args:{expansion:{renderExpandedRow:e=>`${e.name} runs in ${e.region} with ${e.cpu} CPU and ${e.memoryGiB} GiB memory.`,getIsRowExpandable:e=>e.kind===`Compute`,onExpandedKeysChange:p()}}},N={args:{columnSettings:{defaultOverrides:{region:{hidden:!0}},onOverridesChange:p()}}},P={args:{csvExport:{supportedKeys:[`name`,`kind`,`status`,`region`,`cpu`,`memory_gib`],onExport:p(async e=>{}),notice:`The export includes at most 1,000 rows.`}}},F={render:function(e){let[t,n]=(0,d.useState)(1),[r,i]=(0,d.useState)(10);return(0,f.jsx)(c,{...e,data:y.slice((t-1)*r,t*r),pagination:{page:t,pageSize:r,totalItems:y.length,onChange:(e,t)=>{n(e),i(t)}}})}},I={args:{data:v.slice(0,5),pagination:!1}},L={args:{isLoading:!0}},R={args:{data:[]}},z={args:{data:[],emptyState:`No resources match the filter.`}},B={render:function(){let[e,t]=(0,d.useState)(!1);return(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(u,{label:`Open settings`,onClick:()=>t(!0)}),(0,f.jsx)(s,{isOpen:e,onOpenChange:t,columns:S.map(e=>({key:e.key,label:String(e.header),isAlwaysVisible:e.isAlwaysVisible})),visibleColumnKeys:[`name`,`kind`,`status`,`cpu`],onApply:p()})]})}},V={render:function(){let[e,t]=(0,d.useState)(!1);return(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(u,{label:`Open export`,onClick:()=>t(!0)}),(0,f.jsx)(r,{isOpen:e,onOpenChange:t,columns:S.map(e=>({key:e.key,label:String(e.header),exportKeys:e.exportKeys??[]})),supportedKeys:[`name`,`kind`,`status`,`cpu`],onExport:p()})]})}},H=[`Default`,`Sorting`,`Selection`,`ColumnResizing`,`NotResizable`,`PinnedColumns`,`StickyHeader`,`GroupHeaders`,`Expansion`,`ColumnSettings`,`CsvExport`,`ServerPagination`,`WithoutPagination`,`Loading`,`Empty`,`CustomEmptyState`,`SettingsModal`,`ExportModal`],w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: function Render(args) {
    const [sort, setSort] = useState<DataGridSort | null>({
      sortKey: "cpu",
      direction: "descending"
    });
    return <DataGrid<Resource> {...args} sort={sort} onSortChange={next => {
      args.onSortChange?.(next);
      setSort(next);
    }} />;
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: function Render(args) {
    const [selectedKeys, setSelectedKeys] = useState<DataGridKey[]>(["res-001", "res-004"]);
    return <DataGrid<Resource> {...args} selection={{
      selectedKeys,
      onChange: keys => setSelectedKeys(keys),
      getIsItemEnabled: r => r.status !== "Pending",
      getRowLabel: r => r.name
    }} />;
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    isResizable: true,
    columns: COLUMNS.map(column => ({
      ...column,
      width: column.width ?? 160
    }))
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    isResizable: false
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    scrollWidth: 1400,
    columns: COLUMNS.map(column => column.key === "name" ? {
      ...column,
      pin: "start" as const,
      width: 180
    } : column.key === "createdAt" ? {
      ...column,
      pin: "end" as const
    } : column)
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    pagination: false,
    maxHeight: 320
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    columns: COLUMNS.map(column => column.key === "cpu" || column.key === "memory" ? {
      ...column,
      groupHeader: "Allocation"
    } : column)
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    expansion: {
      renderExpandedRow: r => \`\${r.name} runs in \${r.region} with \${r.cpu} CPU and \${r.memoryGiB} GiB memory.\`,
      getIsRowExpandable: r => r.kind === "Compute",
      onExpandedKeysChange: fn()
    }
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    columnSettings: {
      defaultOverrides: {
        region: {
          hidden: true
        }
      },
      onOverridesChange: fn()
    }
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    csvExport: {
      supportedKeys: ["name", "kind", "status", "region", "cpu", "memory_gib"],
      onExport: fn(async (_keys: string[]) => {}),
      notice: "The export includes at most 1,000 rows."
    }
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  render: function Render(args) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    return <DataGrid<Resource> {...args} data={MANY_RESOURCES.slice((page - 1) * pageSize, page * pageSize)} pagination={{
      page,
      pageSize,
      totalItems: MANY_RESOURCES.length,
      onChange: (nextPage, nextSize) => {
        setPage(nextPage);
        setPageSize(nextSize);
      }
    }} />;
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    data: RESOURCES.slice(0, 5),
    pagination: false
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    isLoading: true
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    data: []
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  args: {
    data: [],
    emptyState: "No resources match the filter."
  }
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return <>
        <Button label="Open settings" onClick={() => setIsOpen(true)} />
        <DataGridSettingsModal isOpen={isOpen} onOpenChange={setIsOpen} columns={COLUMNS.map(column => ({
        key: column.key,
        label: String(column.header),
        isAlwaysVisible: column.isAlwaysVisible
      }))} visibleColumnKeys={["name", "kind", "status", "cpu"]} onApply={fn()} />
      </>;
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return <>
        <Button label="Open export" onClick={() => setIsOpen(true)} />
        <DataGridExportModal isOpen={isOpen} onOpenChange={setIsOpen} columns={COLUMNS.map(column => ({
        key: column.key,
        label: String(column.header),
        exportKeys: column.exportKeys ?? []
      }))} supportedKeys={["name", "kind", "status", "cpu"]} onExport={fn()} />
      </>;
  }
}`,...V.parameters?.docs?.source}}}})))()}U();export{D as ColumnResizing,N as ColumnSettings,P as CsvExport,z as CustomEmptyState,w as Default,R as Empty,M as Expansion,V as ExportModal,j as GroupHeaders,L as Loading,O as NotResizable,k as PinnedColumns,E as Selection,F as ServerPagination,B as SettingsModal,T as Sorting,A as StickyHeader,I as WithoutPagination,H as __namedExportsOrder,C as default};