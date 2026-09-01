# PROJECT STATE — 5 Đại Tạng Kinh Nikāya

> File này là **bộ nhớ dự án chính thức**. Mọi phiên ChatGPT/Codex mới phải đọc file này trước khi sửa dự án. Không khởi tạo lại kiến trúc nếu chưa đọc.

## 1. Mục tiêu lâu dài
Xây dựng một thư viện kinh Nikāya hiện đại, đa ngôn ngữ, thân thiện điện thoại/tablet/DeX/PC/màn hình rộng, có thể tái sử dụng làm mẫu cho các bộ kinh/tôn giáo khác. Người dùng phải đọc, nghe, tìm kiếm, lưu tiến độ và tải tài liệu ngay trên hệ thống, hạn chế tối đa việc bị đẩy sang website khác.

Repo chính: `nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya`
Framework: Next.js 16 + React 19 + TypeScript.
Hosting: Vercel.
Release marker hiện tại: **V4.10**.

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

## 4. Nghe — kiến trúc V4.10
Mục tiêu bắt buộc: **máy nào vào website cũng phải có giọng đọc cơ bản của thư viện, không phụ thuộc Samsung/Google/Xiaomi TTS**.

Thứ tự:
1. **Giọng thư viện chạy ngay trong trình duyệt bằng eSpeak-NG WebAssembly/Web Worker**.
2. Nếu browser engine không tải/chạy được, fallback sang **server WAV `/api/tts`** (`text2wav` + eSpeak-NG).
3. **Giọng thiết bị/Web Speech API** dùng khi thiết bị có voice đúng ngôn ngữ; `Auto` ưu tiên giọng thiết bị phù hợp vì tự nhiên hơn, nếu không có thì dùng giọng thư viện.
4. **MP3 đúng ngôn ngữ** là lựa chọn bổ sung khi có nguồn đáng tin, không phải hạ tầng nghe chính.

### Pacing tiếng Việt V4.10
- Mặc định UI: **0.8×** (`dễ nghe`).
- Giọng thư viện: base khoảng **120 WPM**, nên 0.8× ≈ **96 WPM**; minimum 78 WPM.
- Giọng thiết bị: Web Speech rate thực tế = `UI rate × 0.85`, nên 0.8× tương đương ~0.68 engine rate.
- Server fallback dùng cùng base 120 WPM cho tiếng Việt.
- Internal chunks khoảng 230 ký tự; device chunks khoảng 155 ký tự.
- Nghỉ giữa chunk khoảng **220–240 ms** để câu không dính vào nhau.
- Tiền xử lý đọc: dấu gạch dài thành nhịp nghỉ; `SC 1` được đọc thành `Đoạn 1`; giảm đọc mã kỹ thuật khó hiểu.
- Pitch giọng thư viện giảm nhẹ (~44) và device pitch ~0.96 để bớt chói.
- Thang tốc độ tiếng Việt: 0.6 / 0.7 / 0.8 / 0.9 / 1.0 / 1.1 / 1.25 / 1.5.

Chi tiết engine:
- Client tải `eSpeakNG` từ các route same-origin `/api/tts-assets/espeakng.js`, `/api/tts-assets/espeakng.worker.js`, `/api/tts-assets/espeakng.worker.data`.
- Các route proxy bản eSpeakNG browser qua jsDelivr và cache dài; worker/data same-origin để tránh lỗi Worker/CORS Android.
- Audio phát bằng Web Audio/ScriptProcessor. Pause/resume dùng AudioContext; stop đóng context/node.
- Lần đầu tải engine có thể tốn vài MB; sau đó browser/Vercel cache.
- Server `/api/tts` là fallback thứ hai, không phải đường chính.
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
- Header luôn render `data-release="V4.10"`; mobile menu cũng hiện V4.10.

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
- V4.10 validated commit `1bdc40afa5eacedceb549407f0c1a2ddc51e2c68` nhận `Vercel` + `Vercel Deployments – khoa` SUCCESS, trỏ đúng project `nikaya-reader-v4-final`.
- Connector ChatGPT ↔ Vercel có thể chưa liệt kê project; không chặn Git auto-deploy.

## 11. Tình trạng source hiện tại (2026-09-01)
- TB 21 là bài test chính; TB 10/TB 22 và bài ở 4 tạng khác dùng kiểm thử navigation/data.
- V4.10 có mini toolbar + mini Nghe/PDF/MP3 và version badge góc trái.
- Samsung/Xiaomi đã xác nhận cả giọng thư viện và giọng thiết bị có thể phát tiếng; V4.10 tập trung sửa **tốc độ quá nhanh/khó nghe**.
- `Auto` giờ ưu tiên voice thiết bị đúng locale nếu có (Samsung), nếu không có thì giọng thư viện (Xiaomi).
- CI run `33520136885` PASS: install, RAG validation, Next build, reader markers V4.10, English route, browser TTS script/worker/data proxy, và server WAV fallback ở rate 0.8.
- Vercel deployment status cho validated V4.10 commit SUCCESS trên project cố định.

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
1. Xác minh V4.10 thực tế trên Xiaomi 15 Ultra và Samsung S25 Ultra: tốc độ mặc định 0.8× phải nghe rõ, không chạy dồn.
2. Nếu vẫn khó nghe ở giọng thư viện, giảm base WPM thêm và/hoặc thay engine voice tự nhiên hơn nhưng vẫn giữ browser/server fallback.
3. Nâng chất lượng giọng Việt, thêm lựa chọn nam/nữ nếu nguồn/model phù hợp và chi phí vận hành chấp nhận được.
4. Hoàn thiện full-text corpus hợp pháp cho 5 bộ và nhiều ngôn ngữ.
5. Local mirror/cache cho bản được phép phân phối.
6. Full-text search segment/chunk + highlight.
7. PDF mục lục/bookmarks/QR và font Pāli chuyên dụng khi có cách nhúng an toàn.
8. TTS highlight câu + nhớ vị trí nghe.
9. PWA/offline theo bộ/ngôn ngữ.
10. Sau đó mở rộng YouTube/SEO/AdSense.
