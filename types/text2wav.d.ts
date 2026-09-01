declare module 'text2wav' {
  type Text2WavOptions={voice?:string;speed?:number;amplitude?:number;wordGap?:number;pitch?:number};
  const text2wav:(text:string,options?:Text2WavOptions)=>Promise<Uint8Array>|Uint8Array;
  export = text2wav;
}
