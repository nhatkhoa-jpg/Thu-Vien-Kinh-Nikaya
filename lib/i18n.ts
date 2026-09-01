export const locales=['vi','en','zh','hi','es','ar','fr','bn','pt','ru','id','ur','de','ja','ko','th'] as const;
export type Locale=typeof locales[number];
export const defaultLocale:Locale='vi';

export const languageNames:Record<Locale,string>={vi:'Tiếng Việt',en:'English',zh:'中文',hi:'हिन्दी',es:'Español',ar:'العربية',fr:'Français',bn:'বাংলা',pt:'Português',ru:'Русский',id:'Bahasa Indonesia',ur:'اردو',de:'Deutsch',ja:'日本語',ko:'한국어',th:'ไทย'};

type Dict=Record<string,string>;
const en:Dict={
 brand:'5 Great Nikāya Collections',brandSub:'Early Buddhist discourses',home:'Home',saved:'Saved',searchShort:'Search',navCollections:'Collections',navLibrary:'Library',navListen:'Listen',navTopics:'Topics',
 heroEyebrow:'READ · LISTEN · SAVE · DOWNLOAD',heroTitle:'The 5 Great Nikāya Collections, in one calm library.',heroLead:'A modern reading and listening space for the early Buddhist discourses—fast search, comfortable reading, audio speed controls, downloads, and saved progress.',explore:'Browse the library',continue:'Continue reading',
 collections:'The 5 Great Nikāya Collections',collectionsLead:'Choose a collection or jump straight to a discourse.',search:'Search title, code, Pāli, or topic…',featured:'Recommended for testing',featuredLead:'A few important discourses are ready to open now.',
 quickRead:'Focused reading',quickAudio:'Audio speed control',quickDownload:'PDF / EPUB',quickProgress:'Saved progress',
 sources:'Source',book:'PDF / EPUB',mp3:'MP3',source:'Open source text',relatedVideo:'Related video',readerIntro:'Overview',readerPractice:'How to use this discourse',openSource:'Read full source text',downloadBook:'Open book downloads',listenNow:'Listen now',minutes:'min read',
 footer:'5 Great Nikāya Collections · source-aware · reader-first.'
};
const vi:Dict={
 brand:'5 Đại Tạng Kinh Nikāya',brandSub:'Thư viện kinh điển Phật giáo nguyên thủy',home:'Trang chủ',saved:'Đã lưu',searchShort:'Tìm',navCollections:'5 Đại Tạng',navLibrary:'Thư viện',navListen:'Nghe kinh',navTopics:'Chủ đề',
 heroEyebrow:'ĐỌC · NGHE · LƯU · TẢI',heroTitle:'5 Đại Tạng Kinh Nikāya trong một thư viện hiện đại.',heroLead:'Tìm kinh thật nhanh, đọc lâu không mệt, nghe audio theo tốc độ riêng, tải tài liệu và quay lại đúng vị trí đang học.',explore:'Mở thư viện',continue:'Đọc tiếp',
 collections:'5 Đại Tạng Kinh Nikāya',collectionsLead:'Chọn một tạng hoặc mở ngay các bài kinh tiêu biểu.',search:'Tìm tên kinh, mã số, Pāli hoặc chủ đề…',featured:'Bài kinh để bạn test ngay',featuredLead:'Tôi đã cập nhật một số bài quan trọng để thử giao diện đọc, nghe và tải.',
 quickRead:'Đọc tập trung',quickAudio:'Audio chỉnh tốc độ',quickDownload:'PDF / EPUB',quickProgress:'Nhớ tiến độ',
 sources:'Nguồn',book:'PDF / EPUB',mp3:'MP3',source:'Mở bản nguồn',relatedVideo:'Video liên quan',readerIntro:'Tóm lược',readerPractice:'Gợi ý cách đọc',openSource:'Đọc toàn văn tại nguồn',downloadBook:'Mở trang tải sách',listenNow:'Nghe ngay',minutes:'phút đọc',
 footer:'5 Đại Tạng Kinh Nikāya · ưu tiên nguồn rõ ràng · thiết kế để học lâu dài.'
};
const overrides:Partial<Record<Locale,Dict>>={
 zh:{brand:'五部尼柯耶大藏',brandSub:'早期佛教经典图书馆',home:'首页',navCollections:'五部尼柯耶',navLibrary:'经库',navListen:'聆听',searchShort:'搜索',heroTitle:'把五部尼柯耶放进一个安静、现代的阅读空间。',explore:'打开经库',collections:'五部尼柯耶',search:'按标题、编号、主题或巴利文搜索…'},
 hi:{brand:'5 महान निकाय संग्रह',brandSub:'प्रारंभिक बौद्ध ग्रंथालय',home:'होम',navCollections:'5 निकाय',navLibrary:'पुस्तकालय',navListen:'सुनें',searchShort:'खोज',heroTitle:'पाँच निकाय एक आधुनिक और शांत अध्ययन स्थान में।',explore:'पुस्तकालय खोलें'},
 es:{brand:'5 Grandes Colecciones Nikāya',brandSub:'Biblioteca de discursos budistas tempranos',home:'Inicio',navCollections:'5 Nikāyas',navLibrary:'Biblioteca',navListen:'Escuchar',searchShort:'Buscar',heroTitle:'Los cinco Nikāyas en una biblioteca moderna y serena.',explore:'Abrir biblioteca'},
 ar:{brand:'مجموعات النيكايا الخمس',brandSub:'مكتبة التعاليم البوذية المبكرة',home:'الرئيسية',navCollections:'النيكايا الخمس',navLibrary:'المكتبة',navListen:'استماع',searchShort:'بحث',heroTitle:'النيكايات الخمس في مكتبة حديثة وهادئة.',explore:'افتح المكتبة'},
 fr:{brand:'5 Grandes Collections Nikāya',brandSub:'Bibliothèque des premiers discours bouddhiques',home:'Accueil',navCollections:'5 Nikāyas',navLibrary:'Bibliothèque',navListen:'Écouter',searchShort:'Rechercher',heroTitle:'Les cinq Nikāyas dans une bibliothèque moderne et apaisée.',explore:'Ouvrir la bibliothèque'},
 bn:{brand:'৫ মহান নিকায় সংগ্রহ',brandSub:'প্রাচীন বৌদ্ধ বাণীর গ্রন্থাগার',home:'হোম',navCollections:'৫ নিকায়',navLibrary:'লাইব্রেরি',navListen:'শুনুন',searchShort:'খুঁজুন'},
 pt:{brand:'5 Grandes Coleções Nikāya',brandSub:'Biblioteca dos primeiros discursos budistas',home:'Início',navCollections:'5 Nikāyas',navLibrary:'Biblioteca',navListen:'Ouvir',searchShort:'Buscar'},
 ru:{brand:'5 великих собраний Никая',brandSub:'Библиотека ранних буддийских наставлений',home:'Главная',navCollections:'5 Никай',navLibrary:'Библиотека',navListen:'Слушать',searchShort:'Поиск'},
 id:{brand:'5 Koleksi Agung Nikāya',brandSub:'Pustaka khotbah Buddhis awal',home:'Beranda',navCollections:'5 Nikāya',navLibrary:'Pustaka',navListen:'Dengar',searchShort:'Cari'},
 ur:{brand:'نکایہ کے 5 عظیم مجموعے',brandSub:'ابتدائی بدھ مت تعلیمات کی لائبریری',home:'ہوم',navCollections:'5 نکایہ',navLibrary:'لائبریری',navListen:'سنیں',searchShort:'تلاش'},
 de:{brand:'5 Große Nikāya-Sammlungen',brandSub:'Bibliothek früher buddhistischer Lehrreden',home:'Start',navCollections:'5 Nikāyas',navLibrary:'Bibliothek',navListen:'Hören',searchShort:'Suchen'},
 ja:{brand:'五大ニカーヤ経蔵',brandSub:'初期仏教経典ライブラリ',home:'ホーム',navCollections:'五大ニカーヤ',navLibrary:'経典',navListen:'聴く',searchShort:'検索'},
 ko:{brand:'5대 니까야 경장',brandSub:'초기 불교 경전 라이브러리',home:'홈',navCollections:'5대 니까야',navLibrary:'경전',navListen:'듣기',searchShort:'검색'},
 th:{brand:'พระไตรปิฎกนิกาย 5 หมวดใหญ่',brandSub:'คลังพระสูตรพุทธศาสนายุคต้น',home:'หน้าแรก',navCollections:'5 นิกาย',navLibrary:'ห้องสมุด',navListen:'ฟัง',searchShort:'ค้นหา'}
};

export function isLocale(v:string):v is Locale{return locales.includes(v as Locale)}
export function dict(locale:Locale):Dict{return {...en,...(locale==='vi'?vi:{}),...(overrides[locale]||{})}}
