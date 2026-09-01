# PROJECT STATE — 5 Đại Tạng Kinh Nikāya

> File này là **bộ nhớ dự án chính thức**. Mọi phiên ChatGPT/Codex mới phải đọc file này trước khi sửa dự án. Không khởi tạo lại kiến trúc nếu chưa đọc.

## 1. Mục tiêu lâu dài
Xây dựng một thư viện kinh Nikāya hiện đại, đa ngôn ngữ, thân thiện điện thoại/tablet/DeX/PC/màn hình rộng, có thể tái sử dụng làm mẫu cho các bộ kinh/tôn giáo khác. Người dùng phải đọc, nghe, tìm kiếm, lưu tiến độ và tải tài liệu ngay trên hệ thống, hạn chế tối đa việc bị đẩy sang website khác.

Repo chính: `nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya`
Framework: Next.js 16 + React 19 + TypeScript.
Hosting mục tiêu: Vercel.

## 2. Tên thương hiệu và mã hiển thị Việt
Tên hiển thị: **5 Đại Tạng Kinh Nikāya**.
Mã Việt là mã chính trên giao diện tiếng Việt; mã Pāli/quốc tế chỉ hiện nhỏ để đối chiếu:
- TrB = Trường Bộ (DN)
- TB = Trung Bộ (MN)
- TƯB = Tương Ưng Bộ (SN)
- TCB = Tăng Chi Bộ (AN)
- TiB = Tiểu Bộ (KN)
Ví dụ: `TB 21` là mã chính, `MN 21` chỉ là mã quốc tế phụ.

## 3. Nguyên tắc nội dung
- Không được dùng trang bài kinh chỉ có tóm tắt rồi bắt người đọc sang website khác để đọc nội dung chính.
- Trang bài kinh phải ưu tiên **toàn văn ngay trong thư viện** cho ngôn ngữ đang chọn.
- Link nguồn chỉ dùng cho provenance/đối chiếu.
- Không tự chuyển fallback sang ngôn ngữ khác khiến người dùng hiểu nhầm.
- Chọn tiếng Việt => nội dung, giọng đọc, PDF mặc định phải là tiếng Việt. English => English. Ngôn ngữ khác áp dụng tương tự.
- Chỉ mirror/tái phân phối bản dịch khi quyền sử dụng cho phép. Metadata nguồn, tác giả/người dịch, license phải đi cùng dữ liệu.

## 4. Nghe
Tầng 1 (bắt buộc): **Browser/Device TTS** đọc trực tiếp toàn văn đang hiển thị bằng Web Speech API. Không phụ thuộc file MP3 ngoài.
Tầng 2 (tùy chọn): MP3 đã kiểm chứng đúng ngôn ngữ. MP3 ngoài chỉ là lựa chọn bổ sung, không phải hạ tầng cốt lõi.
Player MP3 giữ chỉnh tốc độ 0.75×–2× và tua ±15 giây.
Trên trang bài kinh, nút Browser TTS, PDF và MP3 phải nằm **ngay dưới tiêu đề/công cụ đọc**, không giấu ở cột phụ phía dưới trên mobile.

### Android/Chrome TTS
- Không được set UI sang “đang đọc” trước khi `SpeechSynthesisUtterance.onstart` thực sự chạy.
- Không để effect reload voice gọi `speechSynthesis.cancel()` giữa phiên đọc khi Chrome nạp voices trễ.
- Chia toàn văn thành chunk ngắn (~220 ký tự) để tránh lỗi Chrome Android với utterance dài.
- Nạp voices nhiều lần sau mount + lắng nghe `voiceschanged`; hỗ trợ cả locale dạng `vi-VN` và Android dạng `vi_VN`.
- Nếu không có voice/engine, UI phải báo lỗi thật (`synthesis-unavailable`, `language-unavailable`, `voice-unavailable`, `not-allowed`...) và cho Thử lại; không được giả trạng thái “Tạm dừng” khi thực tế không phát tiếng.
- Nếu Chrome không expose voice nào, vẫn thử system default và hiện fallback hướng dẫn Android Chrome `⋮ -> Nghe trang này` / cấu hình Text-to-speech của hệ thống.

## 5. PDF
- Không dùng PDF bên ngoài làm bản chính trên UI.
- Website tự sinh PDF từ chính nội dung hiện đang có trong thư viện.
- PDF phải có bìa/branding, mã Việt, tên kinh, Pāli, tóm lược, toàn văn, nguồn, số trang, màu nhận diện và typography rõ.
- Hiện dùng `pdfmake` tải động phía client để tránh tăng bundle trang đọc.
- Text đưa vào PDF phải `normalize('NFC')` và loại zero-width characters để giảm lỗi Unicode.
- Không dùng italic cho dòng Pāli nếu font nhúng gây thiếu glyph; ưu tiên hiển thị đúng ký tự hơn hiệu ứng chữ nghiêng.
- Bản PDF hiện dùng body ~13pt, summary ~14.2pt, title ~34pt; mỗi segment có marker riêng, summary card, màu nhận diện, header/footer và nền đọc nhẹ để bớt nhàm chán.

## 6. Điều hướng và tìm kiếm
- Header phải có Trang chủ, 5 Đại Tạng, Thư viện, Nghe, tìm kiếm toàn thư viện, chọn ngôn ngữ và menu mobile.
- Trang bài kinh phải có điều hướng nhanh: Trang chủ, Thư viện, bài trước, bài sau, select nhảy trực tiếp trong cùng bộ.
- Search phải tìm được mã Việt, mã quốc tế, tên Việt/Anh, Pāli, chủ đề và tóm tắt. Khi corpus lớn, thay bundle client bằng search-index phân mảnh hoặc API/FTS; không thay UX.

## 7. Responsive UX
Bắt buộc test ít nhất 4 lớp:
- Phone <= 640px
- Tablet/DeX 641–1024px
- Desktop 1025–1499px
- Wide >= 1500px
Mobile có bottom dock; không để dock che nội dung/nút quan trọng. Reader ưu tiên typography dài hạn, font size controls, dark mode, save/resume.
Trên mobile, mọi giá trị `reader-width` lưu trong localStorage **không được phép làm nội dung rộng hơn viewport**; `.readerLayout`, `.readerMain`, `.suttaText`, `.fullTextBody` phải bị khóa `max-width:100%` và không overflow ngang.

## 8. Dữ liệu dùng cho website + RAG/AI
Nguồn chuẩn metadata: `data/catalog/*.json`.
Không nhét nội dung quan trọng chỉ trong JSX/HTML.
Mỗi bài giữ ID ổn định, canonical ref, code quốc tế, viCode, title, Pāli, topics, source, translator/license, version.
RAG export: `npm run rag:export`.
Mỗi chunk phải có stable id + `content_hash` + `embedding_cache_key`, để chỉ re-embed đoạn thay đổi.
Mục tiêu tương thích LangChain, LlamaIndex, OpenWebUI, Chroma, Qdrant, FAISS, Milvus, Weaviate, pgvector và local LLM.

## 9. YouTube
YouTube không được biến trang chủ thành feed. Chỉ gắn video thật sự liên quan tại trang bài kinh/chủ đề, dùng lazy-load và `youtube-nocookie`, phục vụ minh họa, SEO và traffic chéo.

## 10. Vercel / domain — QUY TẮC URL CỐ ĐỊNH
- **Không được tạo project Vercel mới cho mỗi phiên bản.**
- Project cố định: `nikaya-reader-v4-final`.
- URL dự án cố định để người dùng bookmark và để trỏ custom domain: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
- Các URL có chuỗi ngẫu nhiên kiểu `...-3lqngypw0-...vercel.app` chỉ là deployment URL nội bộ/preview, **không đưa cho người dùng làm địa chỉ chính**.
- Mọi lần cập nhật phải deploy production vào **cùng project** để alias cố định tự trỏ tới deployment mới nhất.
- Canonical/SEO dùng duy nhất `lib/site.ts` -> `SITE_URL`, lấy `NEXT_PUBLIC_SITE_URL` nếu có. Khi gắn custom domain chỉ đổi biến môi trường này, không đổi route/app.

## 11. Tình trạng hiện tại (2026-09-01)
- UI V2/V3/V4 đã có responsive, reader controls, audio player, i18n, mã Việt, RAG-ready catalog.
- Các bài test gồm TB 10, TB 21, TB 22 và một số bài ở TrB/TƯB/TCB/TiB.
- TB 21 là bài kiểm thử chính.
- Browser TTS + PDF tự sinh + MP3 tiếng Việt dự phòng đã được đưa **ngay dưới tiêu đề** bài kinh.
- Khung mobile đã khóa width theo viewport; reader toolbar được wrap để không vỡ ngang.
- URL SEO/canonical/sitemap/robots đã gom về `SITE_URL` cố định.
- Đã sửa lỗi Android Chrome TTS: voice load trễ không còn cancel phiên đọc; chỉ báo speaking sau `onstart`; chunk đọc ngắn; có watchdog/error state/retry và cảnh báo khi thiết bị không expose TTS voice.
- Đã redesign PDF: chữ lớn hơn, Unicode NFC, bỏ Pāli italic dễ lỗi glyph, summary card, segment markers, màu/branding/header/footer dễ đọc lâu.
- **Latest validated code commit:** `4d8f53ad72c8245d2fa91edb8fef6414badf06f6`.
- GitHub Actions run `33508213740`: npm install, RAG export/validate, Next build, smoke tests đều PASS.
- Đã gửi production deployment vào đúng project `nikaya-reader-v4-final`: deployment `dpl_Ag6yoeWbc7H9fBeTSUxHGpwwYGg8`; stable alias vẫn là `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
- Vercel connector hiện vẫn có lỗi read-back 404 sau khi tạo deployment; không được vì lỗi connector này mà tạo project mới. Kiểm tra stable alias/production, sửa trên cùng project.

## 12. Quy trình chuẩn khi tiếp tục dự án
1. Đọc `PROJECT_STATE.md` và `AGENTS.md`.
2. Đọc commit/main hiện tại và CI gần nhất.
3. **Không tạo project/repo/Vercel address mới nếu chưa có lý do đặc biệt.**
4. Thay đổi dữ liệu ở catalog/corpus trước; UI chỉ đọc dữ liệu đó.
5. Build + smoke-test mobile reader TB 21 và home `/vi`.
6. Chỉ deploy commit đã xanh vào project Vercel cố định `nikaya-reader-v4-final`.
7. Xác minh stable alias; không gửi deployment URL ngẫu nhiên cho người dùng.
8. Cập nhật mục "Tình trạng hiện tại" trong file này nếu kiến trúc/quy tắc thay đổi.

## 13. Ưu tiên tiếp theo
1. Hoàn thiện full-text corpus hợp pháp cho 5 bộ và nhiều ngôn ngữ.
2. Tạo local mirror/cache cho các bản được phép tái phân phối để giảm phụ thuộc nguồn ngoài.
3. Full-text search theo segment/chunk, highlight kết quả.
4. PDF template nâng cấp thêm mục lục, QR/canonical URL, chapter bookmarks.
5. Browser TTS nâng cấp highlight câu đang đọc và giữ vị trí nghe.
6. PWA/offline packages theo từng bộ/ngôn ngữ.
7. Sau đó mới mở rộng YouTube/SEO/AdSense.
