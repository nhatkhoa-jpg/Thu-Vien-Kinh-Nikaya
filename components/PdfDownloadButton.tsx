'use client';
import {useState} from 'react';
import {Download,FileText,LoaderCircle} from 'lucide-react';

type Props={code:string;title:string;pali:string;summary:string;paragraphs:string[];sourceLabel:string;sourceUrl:string;locale:string};

export default function PdfDownloadButton({code,title,pali,summary,paragraphs,sourceLabel,sourceUrl,locale}:Props){
  const [busy,setBusy]=useState(false);
  async function download(){
    if(!paragraphs.length||busy)return;
    setBusy(true);
    try{
      const pdfMakeModule:any=await import('pdfmake/build/pdfmake');
      const vfsModule:any=await import('pdfmake/build/vfs_fonts');
      const pdfMake=pdfMakeModule.default||pdfMakeModule;
      const fontPack=vfsModule.default||vfsModule;
      pdfMake.vfs=fontPack.pdfMake?.vfs||fontPack.vfs||fontPack;
      const vi=locale==='vi';
      const doc:any={
        pageSize:'A4',pageMargins:[52,70,52,60],
        background:(page:number)=>({canvas:[{type:'rect',x:0,y:0,w:595,h:842,color:page===1?'#f8f4ea':'#fbfaf6'}]}),
        header:(current:number)=>current===1?null:{margin:[52,28,52,0],columns:[{text:'5 Đại Tạng Kinh Nikāya',fontSize:9,bold:true,color:'#17634d'},{text:`${code} · ${title}`,fontSize:8,color:'#6d756f',alignment:'right'}]},
        footer:(current:number,total:number)=>({margin:[52,18,52,0],columns:[{text:vi?'Thư viện 5 Đại Tạng Kinh Nikāya':'Five Nikāya Library',fontSize:8,color:'#7b817d'},{text:`${current} / ${total}`,fontSize:8,color:'#7b817d',alignment:'right'}]}),
        content:[
          {text:'5 ĐẠI TẠNG KINH NIKĀYA',style:'brand',margin:[0,0,0,30]},
          {text:code,style:'code'},
          {text:title,style:'title',margin:[0,12,0,4]},
          {text:pali,style:'pali',margin:[0,0,0,22]},
          {canvas:[{type:'line',x1:0,y1:0,x2:491,y2:0,lineWidth:2,lineColor:'#d7aa57'}],margin:[0,0,0,20]},
          {text:vi?'TÓM LƯỢC':'SUMMARY',style:'label'},
          {text:summary,style:'summary',margin:[0,6,0,24]},
          {text:vi?'TOÀN VĂN':'FULL TEXT',style:'label',margin:[0,0,0,8]},
          ...paragraphs.map((p,i)=>({text:p,style:'body',margin:[0,0,0,11],id:`p${i+1}`})),
          {stack:[{text:vi?'NGUỒN & ĐỐI CHIẾU':'SOURCE & VERIFICATION',style:'label'},{text:sourceLabel,fontSize:9,color:'#5e6862',margin:[0,6,0,3]},{text:sourceUrl,fontSize:8,color:'#17634d'}],margin:[0,24,0,0]}
        ],
        defaultStyle:{font:'Roboto'},
        styles:{brand:{fontSize:10,bold:true,color:'#17634d',characterSpacing:1.5},code:{fontSize:14,bold:true,color:'#9a641d'},title:{fontSize:28,bold:true,color:'#17221c',lineHeight:1.05},pali:{fontSize:12,italics:true,color:'#717973'},label:{fontSize:9,bold:true,color:'#9a641d',characterSpacing:1.1},summary:{fontSize:12,bold:true,color:'#344039',lineHeight:1.45},body:{fontSize:11.2,color:'#202822',lineHeight:1.6}}
      };
      const safe=`${code}-${title}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
      pdfMake.createPdf(doc).download(`${safe||'kinh-nikaya'}.pdf`);
    }finally{setBusy(false);}
  }
  return <button className="pdfDownloadButton" onClick={download} disabled={!paragraphs.length||busy}>{busy?<LoaderCircle className="spin" size={18}/>:<Download size={18}/>}<span><strong>{locale==='vi'?'Tạo & tải PDF':'Create & download PDF'}</strong><small>{locale==='vi'?'PDF do thư viện tự tạo từ nội dung đang đọc':'Generated from the current library text'}</small></span><FileText size={20}/></button>;
}
