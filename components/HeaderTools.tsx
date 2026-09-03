'use client';
import {useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {Activity,BookMarked,BookOpen,Headphones,Home,Library,Menu,Search,X} from 'lucide-react';
import {collections,suttas,suttaDisplayCode} from '@/lib/data';
import type {Locale} from '@/lib/i18n';
import {publicUi} from '@/lib/public-ui';
import {homeUi} from '@/lib/home-copy';

const l:Record<string,{open:string;close:string;closeSearch:string;whole:string;none:string;librarySearch:string;featured:string;saved:string;collections:string;query:string}>={
 vi:{open:'Mở menu',close:'Đóng menu',closeSearch:'Đóng tìm kiếm',whole:'Tìm trong toàn bộ thư viện',none:'Không tìm thấy. Thử mã kinh hoặc từ khóa khác.',librarySearch:'Tìm & đọc kinh',featured:'Nghe kinh nổi bật',saved:'Đoạn kinh đã lưu',collections:'5 bộ kinh',query:'Tìm TB 21, TrB 1, tên kinh, Pāli, chủ đề…'},
 en:{open:'Open menu',close:'Close menu',closeSearch:'Close search',whole:'Search the whole library',none:'No results. Try another code or keyword.',librarySearch:'Library search',featured:'Featured listening',saved:'Saved passages',collections:'Collections',query:'Search code, title, Pāli or topic…'},
 th:{open:'เปิดเมนู',close:'ปิดเมนู',closeSearch:'ปิดการค้นหา',whole:'ค้นหาทั้งคลัง',none:'ไม่พบผลลัพธ์ ลองรหัสหรือคำค้นอื่น',librarySearch:'ค้นและอ่านพระสูตร',featured:'รายการเสียงแนะนำ',saved:'ข้อความที่บันทึก',collections:'นิกาย 5 หมวด',query:'ค้นรหัส ชื่อ บาลี หรือหัวข้อ…'},
 my:{open:'မီနူးဖွင့်ရန်',close:'မီနူးပိတ်ရန်',closeSearch:'ရှာဖွေမှု ပိတ်ရန်',whole:'စာကြည့်တိုက်တစ်ခုလုံး ရှာရန်',none:'မတွေ့ပါ။ အခြားကုဒ် သို့မဟုတ် စကားလုံး စမ်းပါ။',librarySearch:'ရှာဖွေ၍ ဖတ်ရန်',featured:'အထူးအသံဖတ်',saved:'သိမ်းထားသော ကျမ်းပိုဒ်များ',collections:'နိကာယ် ၅ ရပ်',query:'ကုဒ်၊ ခေါင်းစဉ်၊ ပါဠိ သို့မဟုတ် အကြောင်းအရာ…'},
 si:{open:'මෙනුව විවෘත කරන්න',close:'මෙනුව වසන්න',closeSearch:'සෙවීම වසන්න',whole:'මුළු පුස්තකාලයම සොයන්න',none:'ප්‍රතිඵල නැත. වෙනත් කේතයක් හෝ වචනයක් උත්සාහ කරන්න.',librarySearch:'සොයන්න සහ කියවන්න',featured:'තෝරාගත් ශ්‍රව්‍ය',saved:'සුරකින ලද පාඨ',collections:'නිකාය පහ',query:'කේතය, මාතෘකාව, පාලි හෝ විෂය සොයන්න…'},
 km:{open:'បើកម៉ឺនុយ',close:'បិទម៉ឺនុយ',closeSearch:'បិទការស្វែងរក',whole:'ស្វែងរកក្នុងបណ្ណាល័យទាំងមូល',none:'មិនមានលទ្ធផល។ សាកលេខកូដ ឬពាក្យផ្សេង។',librarySearch:'ស្វែងរក និងអាន',featured:'សំឡេងណែនាំ',saved:'កថាខណ្ឌបានរក្សាទុក',collections:'និកាយ ៥',query:'ស្វែងរកលេខកូដ ចំណងជើង បាលី ឬប្រធានបទ…'},
 lo:{open:'ເປີດເມນູ',close:'ປິດເມນູ',closeSearch:'ປິດການຄົ້ນຫາ',whole:'ຄົ້ນທັງຫໍສະໝຸດ',none:'ບໍ່ພົບຜົນ. ລອງລະຫັດ ຫຼືຄຳອື່ນ.',librarySearch:'ຄົ້ນແລະອ່ານ',featured:'ສຽງແນະນຳ',saved:'ຂໍ້ຄວາມທີ່ບັນທຶກ',collections:'ນິກາຍ 5',query:'ຄົ້ນລະຫັດ ຊື່ ບາລີ ຫຼືຫົວຂໍ້…'},
 zh:{open:'打开菜单',close:'关闭菜单',closeSearch:'关闭搜索',whole:'搜索整个图书馆',none:'没有结果，请尝试其他编号或关键词。',librarySearch:'查找并阅读经文',featured:'精选聆听',saved:'已保存的经文',collections:'五部尼柯耶',query:'搜索编号、标题、巴利文或主题…'}
};

export default function HeaderTools({locale}:{locale:Locale}){
  const vi=locale==='vi';const en=locale==='en';const u=publicUi(locale);const h=homeUi(locale);const x=l[locale]||l.en;
  const router=useRouter();const [searchOpen,setSearchOpen]=useState(false);const [menuOpen,setMenuOpen]=useState(false);const [q,setQ]=useState('');
  const results=useMemo(()=>{const needle=q.trim().toLocaleLowerCase();if(!needle)return suttas.slice(0,8);return suttas.filter(s=>[s.code,s.viCode,s.vi,s.en,s.pali,...s.topics,s.summaryVi,s.summaryEn,s.practiceVi,s.practiceEn].join(' ').toLocaleLowerCase().includes(needle)).slice(0,10);},[q]);
  function go(slug:string){setSearchOpen(false);setMenuOpen(false);setQ('');router.push(`/${locale}/library/${slug}`);}
  const title=(s:(typeof suttas)[number])=>vi?s.vi:en?s.en:(s.pali||s.code);
  return <>
    <button className="headerSearchTrigger" onClick={()=>setSearchOpen(true)} aria-label={h.search}><Search size={18}/><span>{h.search}…</span></button>
    <button className="mobileMenuButton" onClick={()=>setMenuOpen(true)} aria-label={x.open}><Menu size={21}/></button>
    {searchOpen&&<div className="commandBackdrop" onMouseDown={()=>setSearchOpen(false)}><section className="commandPalette" onMouseDown={e=>e.stopPropagation()}>
      <div className="commandHead"><Search size={20}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder={x.query}/><button onClick={()=>setSearchOpen(false)} aria-label={x.closeSearch}><X size={20}/></button></div>
      <div className="commandHint">{x.whole}</div>
      <div className="commandResults">{results.length?results.map(s=><button key={s.slug} onClick={()=>go(s.slug)}><span className="commandCode">{suttaDisplayCode(s,vi)}{vi&&<small>{s.code}</small>}</span><span><strong>{title(s)}</strong><small>{s.pali}</small></span></button>):<p className="commandEmpty">{x.none}</p>}</div>
    </section></div>}
    {menuOpen&&<div className="drawerBackdrop" onMouseDown={()=>setMenuOpen(false)}><aside className="mobileDrawer" onMouseDown={e=>e.stopPropagation()} aria-label={u.libraryInfo}>
      <div className="drawerHead"><strong>{u.brand}</strong><button onClick={()=>setMenuOpen(false)} aria-label={x.close}><X size={21}/></button></div>
      <nav>
        <Link onClick={()=>setMenuOpen(false)} href={`/${locale}`}><Home size={19}/>{u.home}</Link>
        <Link onClick={()=>setMenuOpen(false)} href={`/${locale}#library`}><BookOpen size={19}/>{x.librarySearch}</Link>
        <Link onClick={()=>setMenuOpen(false)} href={`/${locale}#featured`}><Headphones size={19}/>{x.featured}</Link>
        <Link onClick={()=>setMenuOpen(false)} href={`/${locale}/bo-suu-tap`}><BookMarked size={19}/>{x.saved}</Link>
        <Link onClick={()=>setMenuOpen(false)} href={`/${locale}/tien-do`}><Activity size={19}/>{u.progress}</Link>
        <button onClick={()=>{setMenuOpen(false);setSearchOpen(true)}}><Search size={19}/>{h.search}</button>
        <div className="drawerCollectionTitle">{x.collections}</div>
        {collections.map(c=><Link className="drawerCollectionLink" onClick={()=>setMenuOpen(false)} href={`/${locale}?collection=${c.code}#library`} key={c.code}><Library size={17}/><span><strong>{vi?c.vi:en?c.en:c.pali}</strong><small>{vi?`${c.viCode} · ${c.code}`:c.code}</small></span></Link>)}
      </nav>
    </aside></div>}
  </>;
}
