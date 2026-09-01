export const locales = ['vi','en','zh','hi','es','ar','fr','bn','pt','ru','id','ur','de','ja','ko','th'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'vi';

export const languageNames: Record<Locale,string> = {
  vi:'Tiếng Việt', en:'English', zh:'中文', hi:'हिन्दी', es:'Español', ar:'العربية', fr:'Français', bn:'বাংলা', pt:'Português', ru:'Русский', id:'Bahasa Indonesia', ur:'اردو', de:'Deutsch', ja:'日本語', ko:'한국어', th:'ไทย'
};

type Dict = Record<string,string>;
const en: Dict = {
  brand:'Nikāya Library', navLibrary:'Library', navListen:'Listen', navTopics:'Topics', heroEyebrow:'The Five Nikāyas · Read · Listen · Study', heroTitle:'A calm home for the Buddha’s early discourses.', heroLead:'Read without distraction, listen at your pace, save what matters, and move between translations, audio, PDF and explanatory video in one place.', explore:'Explore the library', continue:'Continue reading', collections:'Five collections', collectionsLead:'A clear doorway into the five major Nikāya collections.', search:'Search by title, code, topic or Pāli…', features:'Designed for long study', featuresLead:'Useful tools stay close; everything else gets out of the way.', fRead:'Focused reader', fReadD:'Comfortable typography, adjustable reading width and a clean text-first layout.', fAudio:'Audio + downloads', fAudioD:'Listen in-page with speed control and download MP3 or PDF when a licensed file is available.', fProgress:'Keep your place', fProgressD:'Bookmarks and reading progress are saved locally so you can return quickly.', videoTitle:'YouTube, without turning the library into a feed', videoBody:'Relevant videos can be attached to a discourse, collection or topic. The page keeps scripture first while video adds context, discovery and a path back to your channels.', videoCta:'Video integration ready', libraryTitle:'Start with selected discourses', libraryLead:'The data model is ready for the complete canon and multiple translations.', sources:'Sources & rights', pdf:'PDF', mp3:'MP3', open:'Open', unavailable:'Awaiting licensed file', source:'Original source', relatedVideo:'Related video', textNotice:'Full text is displayed only when the translation licence allows redistribution. The structure is ready for licensed corpus import.', footer:'A multilingual, source-aware Nikāya study library.'
};
const vi: Dict = {
  brand:'Thư viện Nikāya', navLibrary:'Thư viện', navListen:'Nghe kinh', navTopics:'Chủ đề', heroEyebrow:'Ngũ Bộ Nikāya · Đọc · Nghe · Học', heroTitle:'Một không gian tĩnh để đọc và nghe lời Phật dạy.', heroLead:'Đọc không xao nhãng, nghe theo tốc độ riêng, lưu bài quan trọng và chuyển giữa bản dịch, audio, PDF, video minh họa ngay trong một nơi.', explore:'Khám phá thư viện', continue:'Đọc tiếp', collections:'Ngũ Bộ Nikāya', collectionsLead:'Lối vào trực quan cho năm bộ kinh lớn của hệ Nikāya.', search:'Tìm tên kinh, mã số, chủ đề hoặc Pāli…', features:'Thiết kế để học lâu không mệt', featuresLead:'Thứ cần dùng luôn ở gần; phần gây xao nhãng được lược bỏ.', fRead:'Chế độ đọc tập trung', fReadD:'Chữ dễ đọc, khoảng dòng thoáng, bề rộng nội dung hợp lý và ưu tiên văn bản.', fAudio:'Audio + tải xuống', fAudioD:'Nghe ngay trên trang, chỉnh tốc độ và tải MP3/PDF khi có tệp được phép phân phối.', fProgress:'Nhớ vị trí đang đọc', fProgressD:'Đánh dấu và tiến độ đọc lưu tại máy để quay lại nhanh.', videoTitle:'Tích hợp YouTube nhưng không biến thư viện thành “feed”', videoBody:'Video phù hợp có thể gắn theo từng bài kinh, bộ kinh hoặc chủ đề. Kinh vẫn là nội dung chính; video dùng để minh họa, tăng khám phá và dẫn traffic về các kênh YouTube.', videoCta:'Đã sẵn kiến trúc YouTube', libraryTitle:'Bắt đầu từ các bài kinh tiêu biểu', libraryLead:'Cấu trúc dữ liệu đã sẵn cho toàn bộ tạng và nhiều bản dịch.', sources:'Nguồn & bản quyền', pdf:'PDF', mp3:'MP3', open:'Mở', unavailable:'Chờ tệp có quyền phân phối', source:'Nguồn gốc', relatedVideo:'Video liên quan', textNotice:'Toàn văn chỉ hiển thị khi giấy phép của bản dịch cho phép tái phân phối. Kiến trúc đã sẵn để nhập kho dữ liệu hợp pháp.', footer:'Thư viện Nikāya đa ngôn ngữ, ưu tiên nguồn rõ ràng và trải nghiệm học lâu dài.'
};

const overrides: Partial<Record<Locale,Dict>> = {
  zh:{heroTitle:'一个安静阅读与聆听早期佛经的空间。', explore:'浏览经藏', collections:'五部尼柯耶', search:'按标题、编号、主题或巴利文搜索…', libraryTitle:'从精选经文开始', pdf:'PDF', mp3:'MP3'},
  hi:{heroTitle:'बुद्ध के प्रारंभिक उपदेशों को पढ़ने और सुनने का शांत स्थान।', explore:'पुस्तकालय देखें', collections:'पाँच निकाय', search:'शीर्षक, कोड, विषय या पालि से खोजें…'},
  es:{heroTitle:'Un espacio sereno para leer y escuchar los primeros discursos del Buda.', explore:'Explorar la biblioteca', collections:'Los cinco Nikāyas', search:'Buscar por título, código, tema o pali…'},
  ar:{heroTitle:'مساحة هادئة لقراءة وسماع خطب بوذا المبكرة.', explore:'استكشف المكتبة', collections:'النيكايات الخمس', search:'ابحث بالعنوان أو الرمز أو الموضوع أو البالية…'},
  fr:{heroTitle:'Un espace calme pour lire et écouter les premiers discours du Bouddha.', explore:'Explorer la bibliothèque', collections:'Les cinq Nikāyas', search:'Rechercher par titre, code, thème ou pāli…'},
  bn:{heroTitle:'বুদ্ধের প্রাচীন বাণী পড়া ও শোনার জন্য শান্ত একটি স্থান।', explore:'লাইব্রেরি দেখুন', collections:'পাঁচ নিকায়'},
  pt:{heroTitle:'Um espaço sereno para ler e ouvir os primeiros discursos do Buda.', explore:'Explorar a biblioteca', collections:'Os cinco Nikāyas'},
  ru:{heroTitle:'Спокойное пространство для чтения и прослушивания ранних наставлений Будды.', explore:'Открыть библиотеку', collections:'Пять Никай'},
  id:{heroTitle:'Ruang tenang untuk membaca dan mendengarkan khotbah awal Buddha.', explore:'Jelajahi pustaka', collections:'Lima Nikāya'},
  ur:{heroTitle:'بدھ کی ابتدائی تعلیمات پڑھنے اور سننے کے لیے ایک پُرسکون جگہ۔', explore:'لائبریری دیکھیں', collections:'پانچ نکایہ'},
  de:{heroTitle:'Ein ruhiger Ort zum Lesen und Hören der frühen Lehrreden des Buddha.', explore:'Bibliothek entdecken', collections:'Die fünf Nikāyas'},
  ja:{heroTitle:'ブッダの初期経典を静かに読み、聴くための場所。', explore:'ライブラリを見る', collections:'五部ニカーヤ'},
  ko:{heroTitle:'붓다의 초기 가르침을 차분히 읽고 듣는 공간.', explore:'라이브러리 둘러보기', collections:'다섯 니까야'},
  th:{heroTitle:'พื้นที่สงบสำหรับอ่านและฟังพระสูตรยุคต้นของพระพุทธเจ้า', explore:'สำรวจห้องสมุด', collections:'นิกายทั้งห้า'}
};

export function isLocale(v:string): v is Locale { return locales.includes(v as Locale); }
export function dict(locale:Locale): Dict { return {...en, ...(locale==='vi'?vi:{}), ...(overrides[locale]||{})}; }
