export default function YouTubeEmbed({videoId,title}:{videoId?:string;title:string}){
  if(!videoId) return null;
  return <div style={{position:'relative',aspectRatio:'16/9',overflow:'hidden',borderRadius:16,background:'#111'}}>
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`}
      title={title}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      style={{position:'absolute',inset:0,width:'100%',height:'100%',border:0}}
    />
  </div>;
}
