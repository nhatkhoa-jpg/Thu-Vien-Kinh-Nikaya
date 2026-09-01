export const locales=['vi','en','zh','hi','es','ar','fr','bn','pt','ru','id','ur','de','ja','ko','th'] as const;
export type Locale=typeof locales[number];
export const defaultLocale:Locale='vi';

export const languageNames:Record<Locale,string>={vi:'Tiếng Việt',en:'English',zh:'中文',hi:'हिन्दी',es:'Español',ar:'العربية',fr:'Français',bn:'বাংলা',pt:'Português',ru:'Русский',id:'Bahasa Indonesia',ur:'اردو',de:'Deutsch',ja:'日本語',ko:'한국어',th:'ไทย'};

type Dict=Record<string,string>;
const en:Dict={
 brand:'5 Great Nikāya Collections',brandSub:'Early Buddhist discourses',home:'Home',saved:'Saved',searchShort:'Search',navCollections:'5 Collections',navLibrary:'Library',navListen:'Listen',navTopics:'Topics',
 heroEyebrow:'READ · LISTEN · SAVE · DOWNLOAD',heroTitle:'The 5 Great Nikāya Collections, in one calm library.',heroLead:'Search the discourses quickly, read comfortably for long sessions, listen at your own pace, download editions, and return exactly where you left off.',explore:'Open the library',continue:'Continue reading',
 collections:'5 Great Nikāya Collections',collectionsLead:'Choose a collection or open a highlighted discourse.',search:'Search title, code, Pāli, or topic…',featured:'Featured discourses',featuredLead:'Important discourses selected as clear starting points for reading and listening.',
 quickRead:'Focused reading',quickAudio:'Audio speed control',quickDownload:'PDF / MP3 downloads',quickProgress:'Saved progress',
 sources:'Source',book:'PDF / EPUB',mp3:'MP3',source:'Open source text',relatedVideo:'Related video',readerIntro:'Overview',readerPractice:'Reading guide',openSource:'Read complete source text',downloadBook:'PDF / EPUB downloads',listenNow:'Listen now',minutes:'min read',
 footer:'Read calmly, listen carefully, and return whenever you wish.'
};
const vi:Dict={
 brand:'5 Đại Tạng Kinh Nikāya',brandSub:'Thư viện kinh điển Phật giáo nguyên thủy',home:'Trang chủ',saved:'Đã lưu',searchShort:'Tìm',navCollections:'5 Đại Tạng',navLibrary:'Thư viện',navListen:'Nghe kinh',navTopics:'Chủ đề',
 heroEyebrow:'ĐỌC · NGHE · LƯU · TẢI',heroTitle:'5 Đại Tạng Kinh Nikāya trong một thư viện hiện đại.',heroLead:'Tìm kinh thật nhanh, đọc lâu không mệt, nghe audio theo tốc độ riêng, tải tài liệu và quay lại đúng vị trí đang học.',explore:'Mở thư viện',continue:'Đọc tiếp',
 collections:'5 Đại Tạng Kinh Nikāya',collectionsLead:'Chọn một tạng hoặc mở ngay các bài kinh tiêu biểu.',search:'Tìm tên kinh, mã số, Pāli hoặc chủ đề…',featured:'Bài kinh nổi bật',featuredLead:'Những bài kinh quan trọng được chọn làm điểm bắt đầu rõ ràng để đọc và nghe.',
 quickRead:'Đọc tập trung',quickAudio:'Audio chỉnh tốc độ',quickDownload:'Tải PDF / MP3',quickProgress:'Nhớ tiến độ',
 sources:'Nguồn',book:'PDF / EPUB',mp3:'MP3',source:'Mở bản nguồn',relatedVideo:'Video liên quan',readerIntro:'Tóm lược',readerPractice:'Gợi ý cách đọc',openSource:'Đọc toàn văn tại nguồn',downloadBook:'Tải PDF / EPUB',listenNow:'Nghe ngay',minutes:'phút đọc',
 footer:'Đọc chậm, nghe kỹ và quay lại bất cứ lúc nào.'
};
const overrides:Partial<Record<Locale,Dict>>={
 zh:{brand:'五大尼柯耶经藏',brandSub:'早期佛教经典图书馆',home:'首页',navCollections:'五大尼柯耶',navLibrary:'经库',navListen:'聆听',searchShort:'搜索',heroTitle:'把五大尼柯耶放进一个安静、现代的阅读空间。',heroLead:'快速搜索、舒适阅读、调节音频速度、下载版本并保存阅读进度。',explore:'打开经库',collections:'五大尼柯耶经藏',featured:'精选经文',featuredLead:'从重要经文开始阅读与聆听。',search:'按标题、编号、主题或巴利文搜索…'},
 hi:{brand:'5 महान निकाय संग्रह',brandSub:'प्रारंभिक बौद्ध ग्रंथालय',home:'होम',navCollections:'5 निकाय',navLibrary:'पुस्तकालय',navListen:'सुनें',searchShort:'खोज',heroTitle:'पाँच निकाय एक आधुनिक और शांत अध्ययन स्थान में।',heroLead:'तेज़ खोजें, आराम से पढ़ें, ऑडियो गति बदलें और अपनी प्रगति सहेजें।',explore:'पुस्तकालय खोलें',featured:'चयनित सुत्त',featuredLead:'पढ़ने और सुनने के लिए महत्वपूर्ण सुत्तों से शुरुआत करें।'},
 es:{brand:'5 Grandes Colecciones Nikāya',brandSub:'Biblioteca de discursos budistas tempranos',home:'Inicio',navCollections:'5 Nikāyas',navLibrary:'Biblioteca',navListen:'Escuchar',searchShort:'Buscar',heroTitle:'Los cinco Nikāyas en una biblioteca moderna y serena.',heroLead:'Busca rápido, lee con comodidad, ajusta el audio y guarda tu progreso.',explore:'Abrir biblioteca',featured:'Discursos destacados',featuredLead:'Textos importantes para comenzar a leer y escuchar.'},
 ar:{brand:'مجموعات النيكايا الخمس',brandSub:'مكتبة التعاليم البوذية المبكرة',home:'الرئيسية',navCollections:'النيكايا الخمس',navLibrary:'المكتبة',navListen:'استماع',searchShort:'بحث',heroTitle:'النيكايات الخمس في مكتبة حديثة وهادئة.',heroLead:'ابحث بسرعة واقرأ براحة واضبط سرعة الصوت واحفظ تقدمك.',explore:'افتح المكتبة',featured:'نصوص مختارة',featuredLead:'نصوص مهمة للبدء في القراءة والاستماع.'},
 fr:{brand:'5 Grandes Collections Nikāya',brandSub:'Bibliothèque des premiers discours bouddhiques',home:'Accueil',navCollections:'5 Nikāyas',navLibrary:'Bibliothèque',navListen:'Écouter',searchShort:'Rechercher',heroTitle:'Les cinq Nikāyas dans une bibliothèque moderne et apaisée.',heroLead:'Recherchez vite, lisez confortablement, réglez l’audio et gardez votre progression.',explore:'Ouvrir la bibliothèque',featured:'Discours à découvrir',featuredLead:'Des textes importants pour commencer à lire et écouter.'},
 bn:{brand:'৫ মহান নিকায় সংগ্রহ',brandSub:'প্রাচীন বৌদ্ধ বাণীর গ্রন্থাগার',home:'হোম',navCollections:'৫ নিকায়',navLibrary:'লাইব্রেরি',navListen:'শুনুন',searchShort:'খুঁজুন',featured:'নির্বাচিত সূত্র',featuredLead:'পড়া ও শোনা শুরু করার জন্য গুরুত্বপূর্ণ সূত্র।'},
 pt:{brand:'5 Grandes Coleções Nikāya',brandSub:'Biblioteca dos primeiros discursos budistas',home:'Início',navCollections:'5 Nikāyas',navLibrary:'Biblioteca',navListen:'Ouvir',searchShort:'Buscar',featured:'Discursos em destaque',featuredLead:'Textos importantes para começar a ler e ouvir.'},
 ru:{brand:'5 великих собраний Никая',brandSub:'Библиотека ранних буддийских наставлений',home:'Главная',navCollections:'5 Никай',navLibrary:'Библиотека',navListen:'Слушать',searchShort:'Поиск',featured:'Избранные сутты',featuredLead:'Важные тексты для начала чтения и прослушивания.'},
 id:{brand:'5 Koleksi Agung Nikāya',brandSub:'Pustaka khotbah Buddhis awal',home:'Beranda',navCollections:'5 Nikāya',navLibrary:'Pustaka',navListen:'Dengar',searchShort:'Cari',featured:'Sutta pilihan',featuredLead:'Sutta penting sebagai titik awal membaca dan mendengarkan.'},
 ur:{brand:'نکایہ کے 5 عظیم مجموعے',brandSub:'ابتدائی بدھ مت تعلیمات کی لائبریری',home:'ہوم',navCollections:'5 نکایہ',navLibrary:'لائبریری',navListen:'سنیں',searchShort:'تلاش',featured:'منتخب سُتّے',featuredLead:'پڑھنے اور سننے کے لیے اہم سُتّوں سے آغاز کریں۔'},
 de:{brand:'5 Große Nikāya-Sammlungen',brandSub:'Bibliothek früher buddhistischer Lehrreden',home:'Start',navCollections:'5 Nikāyas',navLibrary:'Bibliothek',navListen:'Hören',searchShort:'Suchen',featured:'Ausgewählte Lehrreden',featuredLead:'Wichtige Texte als klarer Einstieg zum Lesen und Hören.'},
 ja:{brand:'五大ニカーヤ経蔵',brandSub:'初期仏教経典ライブラリ',home:'ホーム',navCollections:'五大ニカーヤ',navLibrary:'経典',navListen:'聴く',searchShort:'検索',featured:'注目の経典',featuredLead:'読む・聴くための大切な経典から始められます。'},
 ko:{brand:'5대 니까야 경장',brandSub:'초기 불교 경전 라이브러리',home:'홈',navCollections:'5대 니까야',navLibrary:'경전',navListen:'듣기',searchShort:'검색',featured:'추천 경전',featuredLead:'읽기와 듣기를 시작하기 좋은 주요 경전입니다.'},
 th:{brand:'นิกายะ 5 หมวดใหญ่',brandSub:'คลังพระสูตรพุทธศาสนายุคต้น',home:'หน้าแรก',navCollections:'5 นิกาย',navLibrary:'ห้องสมุด',navListen:'ฟัง',searchShort:'ค้นหา',featured:'พระสูตรแนะนำ',featuredLead:'พระสูตรสำคัญสำหรับเริ่มอ่านและฟัง'}
};

export function isLocale(v:string):v is Locale{return locales.includes(v as Locale)}
export function dict(locale:Locale):Dict{return {...en,...(locale==='vi'?vi:{}),...(overrides[locale]||{})}}
