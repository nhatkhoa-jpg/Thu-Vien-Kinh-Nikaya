'use client';
import {useState} from 'react';
import {Download,FileText,LoaderCircle} from 'lucide-react';

type Props={code:string;title:string;pali:string;summary:string;paragraphs:string[];sourceLabel:string;sourceUrl:string;locale:string};

function clean(value:string){return (value||'').normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim();}
function segmentNode(raw:string,index:number){
  const value=clean(raw);
  const match=value.match(/^SC\s+(\d+(?:\.\d+)?)\s+(.*)$/i);
  const marker=match?`SC ${match[1]}`:String(index+1).padStart(2,'0');
  const body=match?match[2]:value;
  return {columns:[{width:42,text:marker,style:'marker',margin:[0,2,8,0]},{width:'*',text:body,style:'body'}],columnGap:8,margin:[0,0,0,15]};
}

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
      const pdfTitle=clean(title),pdfPali=clean(pali),pdfSummary=clean(summary),pdfSource=clean(sourceLabel);
      const bodyNodes=paragraphs.map(segmentNode);
      const doc:any={
        pageSize:'A4',pageMargins:[46,72,46,62],
        background:(page:number)=>({canvas:[
          {type:'rect',x:0,y:0,w:595,h:842,color:page===1?'#FBF8F1':'#FFFDF9'},
          ...(page===1?[{type:'rect',x:0,y:0,w:595,h:18,color:'#14523F'},{type:'rect',x:0,y:18,w:595,h:5,color:'#D5AC58'}]:[])
        ]}),
        header:(current:number)=>current===1?null:{margin:[46,26,46,0],columns:[{text:'5 ĐẠI TẠNG KINH NIKĀYA',fontSize:9,bold:true,color:'#14523F',characterSpacing:1.1},{text:`${code} · ${pdfTitle}`,fontSize:8.5,color:'#707873',alignment:'right'}]},
        footer:(current:number,total:number)=>({margin:[46,18,46,0],columns:[{text:vi?'Thư viện 5 Đại Tạng Kinh Nikāya':'Five Nikāya Library',fontSize:8.5,color:'#7B817D'},{text:`${current} / ${total}`,fontSize:8.5,color:'#7B817D',alignment:'right'}]}),
        content:[
          {text:'5 ĐẠI TẠNG KINH NIKĀYA',style:'brand',margin:[0,4,0,24]},
          {table:{widths:['auto'],body:[[{text:code,style:'code'}]]},layout:{fillColor:()=> '#F1D79D',hLineWidth:()=>0,vLineWidth:()=>0,paddingLeft:()=>11,paddingRight:()=>11,paddingTop:()=>7,paddingBottom:()=>7},margin:[0,0,0,18]},
          {text:pdfTitle,style:'title',margin:[0,0,0,6]},
          {text:pdfPali,style:'pali',margin:[0,0,0,22]},
          {canvas:[{type:'line',x1:0,y1:0,x2:503,y2:0,lineWidth:2,lineColor:'#D5AC58'}],margin:[0,0,0,22]},
          {table:{widths:['*'],body:[[{stack:[{text:vi?'TÓM LƯỢC':'SUMMARY',style:'label'},{text:pdfSummary,style:'summary',margin:[0,8,0,0]}],fillColor:'#EEF5F1'}]]},layout:{hLineWidth:()=>0,vLineWidth:()=>0,paddingLeft:()=>18,paddingRight:()=>18,paddingTop:()=>16,paddingBottom:()=>16},margin:[0,0,0,30]},
          {columns:[{text:vi?'TOÀN VĂN BÀI KINH':'FULL TEXT',style:'sectionTitle'},{text:`${paragraphs.length} ${vi?'đoạn':'segments'}`,style:'segmentCount',alignment:'right'}],margin:[0,0,0,18]},
          ...bodyNodes,
          {table:{widths:['*'],body:[[{stack:[{text:vi?'NGUỒN & ĐỐI CHIẾU':'SOURCE & VERIFICATION',style:'label'},{text:pdfSource,fontSize:10.5,bold:true,color:'#344039',margin:[0,8,0,4]},{text:sourceUrl,fontSize:9.5,color:'#14523F'}],fillColor:'#F6F2E8'}]]},layout:{hLineWidth:()=>0,vLineWidth:()=>0,paddingLeft:()=>16,paddingRight:()=>16,paddingTop:()=>14,paddingBottom:()=>14},margin:[0,24,0,0]}
        ],
        defaultStyle:{font:'Roboto',color:'#202822'},
        styles:{
          brand:{fontSize:10.5,bold:true,color:'#14523F',characterSpacing:1.6},
          code:{fontSize:15,bold:true,color:'#6E4615'},
          title:{fontSize:34,bold:true,color:'#17221C',lineHeight:1.04},
          pali:{fontSize:13.5,color:'#69726D',lineHeight:1.25},
          label:{fontSize:10,bold:true,color:'#98621E',characterSpacing:1.15},
          summary:{fontSize:14.2,bold:true,color:'#2E3933',lineHeight:1.5},
          sectionTitle:{fontSize:12,bold:true,color:'#14523F',characterSpacing:1.1},
          segmentCount:{fontSize:9.5,color:'#7B817D',margin:[0,2,0,0]},
          marker:{fontSize:9,bold:true,color:'#A46C24',alignment:'right'},
          body:{fontSize:13,color:'#202822',lineHeight:1.58}
        }
      };
      const safe=`${code}-${pdfTitle}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
      pdfMake.createPdf(doc).download(`${safe||'kinh-nikaya'}.pdf`);
    }finally{setBusy(false);}
  }
  return <button className="pdfDownloadButton" onClick={download} disabled={!paragraphs.length||busy}>{busy?<LoaderCircle className="spin" size={18}/>:<Download size={18}/>}<span><strong>{locale==='vi'?'Tạo & tải PDF':'Create & download PDF'}</strong><small>{locale==='vi'?'Bản đọc chữ lớn, trình bày lại từ nội dung của thư viện':'Large-print reading edition generated from library content'}</small></span><FileText size={20}/></button>;
}
