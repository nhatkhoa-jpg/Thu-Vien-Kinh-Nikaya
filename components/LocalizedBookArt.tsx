import type {CSSProperties} from 'react';

type Props={image:string;title:string;pali?:string;className?:string;compact?:boolean};

export default function LocalizedBookArt({image,title,pali,className='',compact=false}:Props){
 const wrap:CSSProperties={position:'relative',overflow:'hidden',backgroundImage:`url(${image})`,backgroundSize:'cover',backgroundPosition:'center'};
 const plate:CSSProperties={position:'absolute',left:'50%',top:'56%',transform:'translate(-50%,-50%)',width:compact?'72%':'68%',padding:compact?'5px 7px':'8px 10px',textAlign:'center',borderRadius:compact?8:10,background:'rgba(9,29,24,.72)',border:'1px solid rgba(244,211,128,.58)',boxShadow:'0 5px 18px rgba(0,0,0,.18)',backdropFilter:'blur(2px)',color:'#fff8df',lineHeight:1.05};
 const titleStyle:CSSProperties={display:'block',fontFamily:'Georgia,"Times New Roman",serif',fontWeight:800,fontSize:compact?'clamp(10px,1.15vw,15px)':'clamp(13px,1.35vw,19px)',textShadow:'0 1px 4px rgba(0,0,0,.45)'};
 const paliStyle:CSSProperties={display:'block',marginTop:4,fontFamily:'Georgia,"Times New Roman",serif',fontStyle:'italic',fontSize:compact?'8px':'10px',color:'#efd187',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'};
 return <div className={className} style={wrap} role="img" aria-label={pali?`${title} — ${pali}`:title}><span style={plate}><strong style={titleStyle}>{title}</strong>{pali&&<small style={paliStyle}>{pali}</small>}</span></div>;
}
