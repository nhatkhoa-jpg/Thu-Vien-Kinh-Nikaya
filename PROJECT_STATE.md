# PROJECT STATE — 5 Đại Tạng Kinh Nikāya

> File này là **bộ nhớ dự án chính thức**. Mọi phiên ChatGPT/Codex mới phải đọc file này trước khi sửa dự án. Không khởi tạo lại kiến trúc nếu chưa đọc.

## 1. Mục tiêu lâu dài
Xây dựng một thư viện kinh Nikāya hiện đại, đa ngôn ngữ, thân thiện điện thoại/tablet/DeX/PC/màn hình rộng, có thể tái sử dụng làm mẫu cho các bộ kinh/tôn giáo khác. Người dùng phải đọc, nghe, tìm kiếm, lưu tiến độ và tải tài liệu ngay trên hệ thống, hạn chế tối đa việc bị đẩy sang website khác.

Repo chính: `nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya`
Framework: Next.js 16 + React 19 + TypeScript.
Hosting: Vercel.
Release marker hiện tại: **V4.9**.

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
- Không dùng trang bài kinh chỉ có tóm tắt rồi bắt người đọc sang website khác để đọc nội dung chính.
- Trang bài kinh ưu tiên **toàn văn ngay trong thư viện** cho ngôn ngữ đang chọn.
- Link nguồn chỉ dùng cho provenance/đối chiếu.
- Không tự fallback sang ngôn ngữ khác khiến người dùng hiểu nhầm.
- Chọn tiếng Việt => nội dung, giọng đọc, PDF mặc định là tiếng Việt. English => English. Ngôn ngữ khác tương tự.
- Chỉ mirror/tái phân phối bản dịch khi quyền sử dụng cho phép; metadata nguồn/người dịch/license đi cùng dữ liệu.

## 4. Nghe — kiến trúc V4.9
Mục tiêu bắt buộc: **máy nào vào website cũng phải có giọng đọc cơ bản của thư viện, không phụ thuộc Samsung/Google/Xiaomi TTS**.

Thứ tự:
1. **Giọng thư viện chạy ngay trong trình duyệt bằng eSpeak-NG WebAssembly/Web Worker**. Đây là chế độ `Auto` mặc định trên mọi thiết bị.
2. Nếu browser engine không tải/chạy được, fallback sang **server WAV `/api/tts`** (`text2wav` + eSpeak-NG).
3. **Giọng thiết bị/Web Speech API** là lựa chọn thủ công thêm; không còn là điều kiện bắt buộc để nghe.
4. **MP3 đúng ngôn ngữ** là lựa chọn bổ sung khi có nguồn đáng tin, không phải hạ tầng nghe chính.

Chi tiết V4.9:
- Client tải `eSpeakNG` từ các route same-origin `/api/tts-assets/espeakng.js`, `/api/tts-assets/espeakng.worker.js`, `/api/tts-assets/espeakng.worker.data`.
- Các route này proxy bản eSpeakNG browser qua jsDelivr và trả cache dài `public/s-maxage/immutable`; worker/data được tải same-origin để tránh lỗi Worker/CORS trên Android.
- Audio được phát bằng Web Audio/ScriptProcessor ngay trong browser. Pause/resume dùng AudioContext; stop đóng context/node.
- `Auto` luôn chọn `internal` browser voice trên Samsung, Xiaomi, desktop; người dùng có thể chọn `Giọng thiết bị` nếu muốn giọng tự nhiên hơn trên máy hỗ trợ.
- Browser TTS chia toàn văn thành chunk ~360 ký tự; device TTS ~210 ký tự.
- Lần đầu tải engine có thể tốn vài MB; sau đó browser/Vercel cache lại.
- Server `/api/tts` vẫn là fallback thứ hai nhưng không được coi là đường chính vì từng thất bại trên Vercel runtime dù local CI tạo WAV thành công.
- Player MP3 giữ chỉnh tốc độ 0.75×–2× và tua ±15 giây.

## 5. PDF
- PDF chính do website tự sinh từ toàn văn bằng `pdfmake`.
- Typography: title ~34pt, summary ~14.2pt, body ~13pt, segment markers, summary card, header/footer, số trang, màu nhận diện.
- Text normalize NFC, loại zero-width + replacement chars.
- PDF dùng Latin fallback cho Pāli Extended dễ vỡ (`ṇ→n`, `ḍ→d`, `ṭ→t`, `ā→a`...) để không còn ô vuông; **web vẫn giữ Pāli chuẩn**.
- Không dùng PDF nguồn ngoài làm bản chính.

## 6. Reader UX / điều hướng
- Header: Trang chủ, 5 Đại Tạng, Thư viện, Nghe, global search, ngôn ngữ, mobile menu.
- Trang bài: Home/Library, trước/sau, jump-to-discourse.
- Search: mã Việt/quốc tế, tên, Pāli, chủ đề, tóm tắt.
- Reader controls rất gọn: font −/+, line-height, width, dark, bookmark/resume là icon khoảng 29–31px có tooltip/title.
- Nghe / PDF / MP3 là 3 disclosure mini, mobile cao khoảng 34px; mặc định đóng, bấm mới bung panel.
- Mobile title khoảng 29–35px; margins rút gọn để vào bài thấy nội dung sớm.
- Trong giai đoạn test luôn hiển thị version rất nhỏ ở góc trái: `.testVersionBadge`; mobile đặt ngay trên bottom dock, desktop sát góc trái dưới. Khi release ổn định thì xoá badge.
- Header luôn render `data-release="V4.9"`; mobile menu cũng hiện V4.9.

## 7. Responsive UX
Bắt buộc test ít nhất 4 lớp:
- Phone <= 640px
- Tablet/DeX 641–1024px
- Desktop 1025–1499px
- Wide >= 1500px
Mobile có bottom dock; không để dock che nội dung/nút quan trọng. `reader-width` trong localStorage không được làm nội dung rộng hơn viewport; reader/full text luôn max-width 100% trên mobile.

## 8. Dữ liệu website + RAG/AI
Nguồn chuẩn metadata: `data/catalog/*.json`.
Không nhét nội dung quan trọng chỉ trong JSX/HTML.
Mỗi bài giữ ID ổn định, canonical ref, code quốc tế, viCode, title, Pāli, topics, source, translator/license, version.
RAG export: `npm run rag:export`.
Mỗi chunk có stable id + `content_hash` + `embedding_cache_key` để chỉ re-embed đoạn thay đổi.
Mục tiêu tương thích LangChain, LlamaIndex, OpenWebUI, Chroma, Qdrant, FAISS, Milvus, Weaviate, pgvector và local LLM.

## 9. YouTube
Không biến trang chủ thành feed. Chỉ gắn video thật sự liên quan tại trang bài/chủ đề, lazy-load + `youtube-nocookie`, phục vụ minh họa, SEO và traffic chéo.

## 10. Vercel / domain — URL CỐ ĐỊNH
- Không tạo project Vercel mới cho mỗi phiên bản.
- Project cố định: `nikaya-reader-v4-final`.
- Stable URL: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
- URL random chỉ là deployment URL nội bộ, không đưa cho user làm URL chính.
- Canonical/SEO dùng `lib/site.ts` -> `SITE_URL`; khi có custom domain chỉ đổi `NEXT_PUBLIC_SITE_URL`.
- Vercel Git Integration nối project hiện hữu với repo GitHub, production branch `main`; mọi push lên `main` tự deploy vào cùng project/URL.

### Git Integration đã khôi phục
- 2026-09-01 user reconnect project hiện hữu với repo `nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya` trong Vercel Settings → Git.
- Commit trigger `d4e801965d987e8ef4558b5c49cdb863a25f26c4` nhận hai GitHub commit status Vercel đều SUCCESS.
- V4.9 commit CI `05551a5514f9a52657d61336555a2cd39cf2fb97` cũng nhận `Vercel` + `Vercel Deployments – khoa` SUCCESS, trỏ đúng project `nikaya-reader-v4-final`.
- Connector ChatGPT ↔ Vercel có thể chưa liệt kê project; không chặn Git auto-deploy. Reconnect app Vercel trong ChatGPT nếu cần đọc runtime logs trực tiếp.

## 11. Tình trạng source hiện tại (2026-09-01)
- TB 21 là bài test chính; TB 10/TB 22 và bài ở 4 tạng khác dùng kiểm thử navigation/data.
- V4.9 có mini toolbar + mini Nghe/PDF/MP3 và version badge góc trái.
- `Auto` dùng browser WebAssembly library voice trên mọi thiết bị; không phụ thuộc voice của hệ thống.
- CI run `33516766020` PASS: install, RAG validation, Next build, reader markers V4.9, route English, browser TTS script/worker/data proxy, và server WAV fallback RIFF.
- Vercel deployment status cho V4.9 SUCCESS trên project cố định.

## 12. Quy trình chuẩn khi tiếp tục
1. Đọc `PROJECT_STATE.md` + `AGENTS.md`.
2. Đọc main + CI mới nhất.
3. Không tạo repo/project/Vercel URL mới nếu không có lý do đặc biệt.
4. Thay dữ liệu ở catalog/corpus trước; UI đọc dữ liệu đó.
5. Build + smoke-test `/vi`, TB 21, `/en`, compact markers, browser TTS assets và server fallback.
6. Chỉ giữ bản đã test trên `main`; Vercel Git Integration tự deploy project cố định.
7. Xác nhận production bằng version badge trên stable URL; không gửi random deployment URL.
8. Update file này khi kiến trúc/quy tắc thay đổi.

## 13. Ưu tiên tiếp theo
1. Xác minh V4.9 thực tế trên Xiaomi 15 Ultra và Samsung S25 Ultra: badge phải là V4.9; `Tự động · giọng thư viện` phải phát được tiếng trên cả hai.
2. Sau khi xác nhận browser TTS ổn, nâng chất lượng giọng Việt (ưu tiên giọng tự nhiên hơn nhưng vẫn có fallback offline/browser).
3. Hoàn thiện full-text corpus hợp pháp cho 5 bộ và nhiều ngôn ngữ.
4. Local mirror/cache cho bản được phép phân phối.
5. Full-text search segment/chunk + highlight.
6. PDF mục lục/bookmarks/QR và font Pāli chuyên dụng khi có cách nhúng an toàn.
7. TTS highlight câu + nhớ vị trí nghe.
8. PWA/offline theo bộ/ngôn ngữ.
9. Sau đó mở rộng YouTube/SEO/AdSense.
