import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowLeft,BookOpen,ExternalLink,ShieldCheck} from 'lucide-react';
import {dict,type Locale} from '@/lib/i18n';
import {SITE_URL} from '@/lib/site';

type Kind='about'|'privacy'|'terms'|'editorial-policy';
type Section={title:string;body:React.ReactNode};

const en={
  about:{title:'About the library',lead:'A calm, source-conscious digital library for reading, listening to, studying and preserving the five Nikāya collections.',sections:[
    ['What we are building','This project brings catalogue data, full-text reading, source references, generated reading PDFs, audio playback and progress tools into one accessible library. The interface is designed for long reading sessions on phones, tablets and desktop screens.'],
    ['Our approach','We prefer traceable editions and clearly identify the translation or upstream source whenever possible. The website may use software and AI to improve search, interface quality, accessibility and production workflows, but not to fabricate scripture text.'],
    ['Languages','Vietnamese and English are the primary scripture languages today. Other interface languages may temporarily display English scripture when a translation is unavailable. Those fallback pages are clearly treated as incomplete until a reliable translation is available.'],
    ['Preservation','Audio and corpus assets may be mirrored across independent storage providers for resilience. A mirror is a preservation copy, not a claim of ownership over third-party source material.']
  ]},
  privacy:{title:'Privacy policy',lead:'A plain-language summary of what this library stores, what it does not need, and how future analytics or advertising will be handled.',sections:[
    ['Data stored on your device','Reading progress, saved passages and similar convenience features may use browser storage on your own device. We aim to keep these features useful without requiring an account.'],
    ['Server and security logs','Hosting providers may process basic request, security and diagnostic information such as IP address, user agent, timestamps and requested URLs for delivery, abuse prevention and reliability.'],
    ['Analytics and advertising','The library does not need advertising cookies to provide scripture reading. If analytics or advertising services such as Google AdSense are enabled, this policy will identify them and appropriate consent controls will be presented where required.'],
    ['Third-party links and media','Pages may link to or embed material from services such as SuttaCentral, YouTube, Internet Archive or storage/CDN providers. Their own privacy policies apply when you interact with those services.'],
    ['Your choices','You can clear local browser data at any time. Where consent controls are required for analytics or advertising, you will be able to use those controls before optional technologies are activated.']
  ]},
  terms:{title:'Terms of use',lead:'Simple terms intended to keep the library open, useful and transparent.',sections:[
    ['Educational and reference use','The library is provided for reading, listening, study and reference. It is not professional legal, medical, financial or other regulated advice.'],
    ['Scripture and translations','Source texts and translations can have their own copyright or licensing terms. We preserve attribution and source links where available. Downloading or reusing a third-party translation does not grant rights beyond its original licence.'],
    ['Availability','The service may change as the corpus is corrected, audio is replaced, sources move or infrastructure is upgraded. We do not guarantee uninterrupted availability of every item.'],
    ['Responsible use','Do not abuse the service, attempt to bypass access controls, overload infrastructure, distribute malware, or use the site in a way that violates applicable law or the rights of others.'],
    ['Corrections','If you discover a source, attribution, encoding or content issue, the project should correct the record rather than silently preserve a known error.']
  ]},
  'editorial-policy':{title:'Sources & editorial policy',lead:'How scripture enters the library, how we distinguish source text from interface material, and how corrections are handled.',sections:[
    ['Source-first corpus','Scripture text should come from identifiable editions or trusted digital repositories. Each item should retain enough provenance to verify the text independently whenever possible.'],
    ['No invented scripture','AI may assist with software, quality checks, metadata suggestions, search, audio production or translation workflow. It must not invent missing scripture passages or present generated prose as canonical text.'],
    ['English fallback','When a requested language has no reliable full text, the reader may temporarily show the English source instead of an empty page. The source language and translation attribution remain visible.'],
    ['Audio policy','Audio is a reading aid derived from a known text version. Audio files may be regenerated when pronunciation, source mapping or quality is improved. The text source remains the authority for verification.'],
    ['Corrections and versioning','Materialized corpus items should be reproducible from a source reference and may carry hashes or version metadata. Corrections should be traceable and should not overwrite provenance.'],
    ['External preservation','Independent mirrors such as Internet Archive can be used as preservation copies when credentials and licensing allow. Public mirrors must preserve source attribution and should not expose private operational secrets.']
  ]}
};

const vi={
  about:{title:'Giới thiệu thư viện',lead:'Một thư viện số yên tĩnh, hiện đại, chú trọng nguồn gốc để đọc, nghe, nghiên cứu và lưu giữ năm bộ Nikāya.',sections:[
    ['Chúng tôi đang xây dựng gì','Dự án kết hợp mục lục, đọc toàn văn, nguồn đối chiếu, PDF tạo từ nội dung đang đọc, audio và lưu tiến độ trong một thư viện dễ dùng trên điện thoại, máy tính bảng và máy tính.'],
    ['Nguyên tắc','Ưu tiên các bản có nguồn rõ ràng và hiển thị người dịch hoặc nguồn gốc khi có thể. Phần mềm và AI có thể hỗ trợ tìm kiếm, giao diện, kiểm tra chất lượng và quy trình sản xuất, nhưng không được bịa kinh văn.'],
    ['Ngôn ngữ','Tiếng Việt và tiếng Anh hiện là hai ngôn ngữ kinh văn chính. Với các ngôn ngữ khác, thư viện có thể tạm dùng bản tiếng Anh khi chưa có bản dịch đáng tin cậy, thay vì để trang trống hoặc tạo nội dung không kiểm chứng.'],
    ['Lưu trữ lâu dài','Audio và dữ liệu kinh có thể được sao lưu trên nhiều nhà cung cấp độc lập để tăng khả năng bảo tồn. Bản sao lưu không đồng nghĩa với việc nhận quyền sở hữu nội dung nguồn của bên thứ ba.']
  ]},
  privacy:{title:'Chính sách quyền riêng tư',lead:'Giải thích ngắn gọn dữ liệu thư viện có thể lưu, dữ liệu không cần thu thập và cách xử lý quảng cáo hoặc analytics trong tương lai.',sections:[
    ['Dữ liệu trên thiết bị','Tiến độ đọc, đoạn đã lưu và một số tiện ích có thể dùng bộ nhớ trình duyệt ngay trên thiết bị của bạn. Mục tiêu là vẫn sử dụng tốt mà không bắt buộc tạo tài khoản.'],
    ['Nhật ký máy chủ và bảo mật','Nhà cung cấp hosting có thể xử lý thông tin kỹ thuật cơ bản như địa chỉ IP, user agent, thời gian và URL truy cập để phân phối nội dung, chống lạm dụng và xử lý sự cố.'],
    ['Analytics và quảng cáo','Việc đọc kinh không phụ thuộc cookie quảng cáo. Nếu sau này bật dịch vụ như Google AdSense hoặc analytics, trang này sẽ nêu rõ và thư viện sẽ dùng cơ chế xin đồng ý phù hợp tại những khu vực pháp luật hoặc chính sách yêu cầu.'],
    ['Liên kết và dịch vụ bên ngoài','Trang có thể liên kết hoặc nhúng nội dung từ SuttaCentral, YouTube, Internet Archive hoặc nhà cung cấp lưu trữ/CDN. Khi tương tác với các dịch vụ đó, chính sách riêng tư của họ cũng được áp dụng.'],
    ['Quyền lựa chọn','Bạn có thể xóa dữ liệu cục bộ của trình duyệt bất cứ lúc nào. Khi cần xin đồng ý cho analytics hoặc quảng cáo, các công nghệ tùy chọn sẽ không được bật trước khi có lựa chọn phù hợp.']
  ]},
  terms:{title:'Điều khoản sử dụng',lead:'Các điều khoản đơn giản để thư viện duy trì tính mở, hữu ích và minh bạch.',sections:[
    ['Mục đích sử dụng','Thư viện phục vụ đọc, nghe, học tập và tham khảo. Nội dung không thay thế tư vấn pháp lý, y tế, tài chính hoặc các dịch vụ chuyên môn có quản lý.'],
    ['Kinh văn và bản dịch','Nguồn kinh và bản dịch có thể thuộc các giấy phép hoặc quyền tác giả khác nhau. Thư viện giữ ghi công và đường dẫn nguồn khi có. Việc tải hoặc tái sử dụng không tạo thêm quyền ngoài giấy phép gốc.'],
    ['Tính sẵn sàng','Dịch vụ có thể thay đổi khi sửa corpus, thay audio, nguồn bên ngoài thay đổi hoặc hạ tầng được nâng cấp. Không bảo đảm mọi mục luôn sẵn sàng liên tục.'],
    ['Sử dụng có trách nhiệm','Không lạm dụng dịch vụ, vượt kiểm soát truy cập, gây quá tải hạ tầng, phát tán mã độc hoặc sử dụng trang theo cách vi phạm pháp luật hay quyền của người khác.'],
    ['Sửa sai','Nếu phát hiện lỗi nguồn, ghi công, mã hóa hoặc nội dung, dự án ưu tiên sửa bản ghi và giữ khả năng đối chiếu thay vì âm thầm giữ lỗi đã biết.']
  ]},
  'editorial-policy':{title:'Nguồn & nguyên tắc biên tập',lead:'Cách kinh văn được đưa vào thư viện, cách phân biệt nội dung nguồn với nội dung giao diện và cách xử lý sửa đổi.',sections:[
    ['Corpus ưu tiên nguồn','Kinh văn phải xuất phát từ bản có thể nhận diện hoặc kho dữ liệu đáng tin cậy. Mỗi mục nên giữ đủ thông tin xuất xứ để người đọc có thể kiểm tra độc lập.'],
    ['Không dùng AI bịa kinh','AI có thể hỗ trợ phần mềm, kiểm tra chất lượng, metadata, tìm kiếm, audio hoặc quy trình dịch. AI không được tạo đoạn kinh còn thiếu rồi trình bày như kinh văn gốc.'],
    ['Tạm dùng tiếng Anh','Khi ngôn ngữ được chọn chưa có toàn văn đáng tin cậy, trình đọc có thể tạm hiển thị bản tiếng Anh thay vì trang trống. Ngôn ngữ nguồn và thông tin người dịch vẫn phải hiện rõ.'],
    ['Nguyên tắc audio','Audio là công cụ hỗ trợ đọc được tạo từ một phiên bản văn bản xác định. File có thể được render lại khi cải thiện phát âm, mapping nguồn hoặc chất lượng. Văn bản nguồn vẫn là cơ sở để đối chiếu.'],
    ['Sửa lỗi và phiên bản','Các mục corpus đã materialize nên có thể tái tạo từ nguồn tham chiếu và có thể mang hash hoặc metadata phiên bản. Sửa đổi không được làm mất dấu xuất xứ.'],
    ['Lưu trữ bên ngoài','Các bản mirror độc lập như Internet Archive có thể được dùng để bảo tồn khi có đủ quyền và thông tin xác thực. Bản public phải giữ ghi công nguồn và tuyệt đối không làm lộ secret vận hành.']
  ]}
};

function content(kind:Kind,locale:Locale){return (locale==='vi'?vi:en)[kind] as {title:string;lead:string;sections:string[][]};}
export function infoMetadata(kind:Kind,locale:Locale):Metadata{const c=content(kind,locale);return{title:c.title,description:c.lead,alternates:{canonical:`${SITE_URL}/${locale}/${kind}`},openGraph:{title:c.title,description:c.lead,url:`${SITE_URL}/${locale}/${kind}`,type:'website'}};}

export default function InfoPage({locale,kind}:{locale:Locale;kind:Kind}){
  const d=dict(locale);const c=content(kind,locale);const viLocale=locale==='vi';
  return <main className="infoPage"><div className="shell infoShell">
    <Link className="infoBack" href={`/${locale}`}><ArrowLeft size={16}/>{viLocale?'Về thư viện':'Back to library'}</Link>
    <header className="infoHero"><span className="infoIcon"><BookOpen size={24}/></span><div><p className="kicker">{d.brand}</p><h1>{c.title}</h1><p>{c.lead}</p></div></header>
    <div className="infoGrid"><article>{c.sections.map(([title,body])=><section key={title}><h2>{title}</h2><p>{body}</p></section>)}</article><aside><div className="infoTrust"><ShieldCheck size={20}/><strong>{viLocale?'Nguyên tắc minh bạch':'Transparency principle'}</strong><p>{viLocale?'Ưu tiên nguồn kiểm chứng được, ghi công rõ ràng và không dùng nội dung tạo sinh để thay thế kinh văn còn thiếu.':'Prefer verifiable sources, clear attribution and no generated text as a substitute for missing scripture.'}</p></div><a href="https://suttacentral.net" target="_blank" rel="noreferrer">SuttaCentral <ExternalLink size={14}/></a></aside></div>
  </div></main>;
}
