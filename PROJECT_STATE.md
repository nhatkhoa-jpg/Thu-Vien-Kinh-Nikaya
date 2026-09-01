# PROJECT STATE — 5 Đại Tạng Kinh Nikāya

> File này là **bộ nhớ dự án chính thức**. Mọi phiên ChatGPT/Codex mới phải đọc file này trước khi sửa dự án. Không khởi tạo lại kiến trúc nếu chưa đọc.

## 1. Mục tiêu lâu dài
Xây dựng một thư viện kinh Nikāya hiện đại, đa ngôn ngữ, thân thiện điện thoại/tablet/DeX/PC/màn hình rộng, có thể tái sử dụng làm mẫu cho các bộ kinh/tôn giáo khác. Người dùng phải đọc, nghe, tìm kiếm, lưu tiến độ và tải tài liệu ngay trên hệ thống, hạn chế tối đa việc bị đẩy sang website khác.

Repo chính: `nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya`
Framework: Next.js 16 + React 19 + TypeScript.
Hosting mục tiêu: Vercel.
Release marker hiện tại: **V4.8**.

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
- Trang bài kinh phải ưu tiên **toàn văn ngay trong thư viện** cho ngôn ngữ đang chọn.
- Link nguồn chỉ dùng cho provenance/đối chiếu.
- Không tự fallback sang ngôn ngữ khác khiến người dùng hiểu nhầm.
- Chọn tiếng Việt => nội dung, giọng đọc, PDF mặc định phải là tiếng Việt. English => English. Ngôn ngữ khác tương tự.
- Chỉ mirror/tái phân phối bản dịch khi quyền sử dụng cho phép; metadata nguồn/người dịch/license đi cùng dữ liệu.

## 4. Nghe — kiến trúc 3 tầng
1. **Internal TTS của thư viện** (`text2wav` + eSpeak-NG, server trả WAV) là đường mặc định trên Android để tránh lỗi Chrome báo speaking nhưng im lặng.
2. **Device/Browser TTS** bằng Web Speech API vẫn có thể chọn thủ công trên thiết bị có voice tốt.
3. **MP3 bổ sung** đúng ngôn ngữ khi có nguồn đáng tin; chỉ là lựa chọn thêm.

Quy tắc:
- Trên Android, mode `Auto` đi thẳng Internal TTS. Không thử device voice trước.
- Trên desktop/non-Android, Auto có thể ưu tiên device voice nếu có; fail thì chuyển Internal.
- Internal TTS chia text thành chunk ~400 ký tự; device TTS ~210 ký tự.
- Khi bấm Nghe, client unlock audio context ngay trong user gesture để tránh autoplay policy của Chrome Android chặn `Audio.play()` sau khi fetch WAV.
- API `/api/tts` chạy Node runtime, voice whitelist theo locale.
- CI bắt buộc POST câu tiếng Việt vào `/api/tts`, kiểm tra WAV có header `RIFF` và >1000 bytes.
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
- Header luôn render `data-release="V4.8"`; mobile menu cũng hiện `V4.8`, dùng để xác nhận production đúng build.

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

## 10. Vercel / domain — QUY TẮC URL CỐ ĐỊNH
- Không tạo project Vercel mới cho mỗi phiên bản.
- Project cố định: `nikaya-reader-v4-final`.
- Stable URL: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
- URL random chỉ là deployment URL nội bộ, không đưa cho user làm URL chính.
- Canonical/SEO dùng `lib/site.ts` -> `SITE_URL`; khi có custom domain chỉ đổi `NEXT_PUBLIC_SITE_URL`.
- Cách triển khai chuẩn: **Vercel Git Integration nối project hiện hữu với repo GitHub này, production branch = `main`**. Mọi push lên `main` tự deploy vào cùng project/URL.

### Git Integration đã khôi phục
- 2026-09-01 người dùng đã reconnect project hiện hữu với repo `nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya` trong Vercel Settings → Git.
- Commit trigger `d4e801965d987e8ef4558b5c49cdb863a25f26c4` nhận hai GitHub commit status từ Vercel đều **SUCCESS**: `Vercel` và `Vercel Deployments – khoa`.
- Status Vercel trỏ đúng project `nikaya-reader-v4-final`, xác nhận GitHub ↔ Vercel đã hoạt động và push `main` có thể tự deploy production vào project cố định.
- Connector ChatGPT ↔ Vercel hiện vẫn có thể chưa liệt kê được project; việc này không chặn Git auto-deploy, nhưng cần reconnect app Vercel trong ChatGPT nếu muốn đọc project/logs trực tiếp qua connector.
- Quy trình từ đây: sửa source → GitHub Actions xanh → push `main` → Vercel auto deploy cùng project → kiểm tra badge version trên stable URL.

## 11. Tình trạng source hiện tại (2026-09-01)
- TB 21 là bài test chính; TB 10/TB 22 và bài ở 4 tạng khác dùng kiểm thử navigation/data.
- Source V4.8 có mini toolbar + mini Nghe/PDF/MP3, khác rõ screenshot production cũ có các khối control lớn.
- Android Auto TTS đi thẳng internal TTS + audio unlock.
- Version V4.8 hiện cố định rất nhỏ ở góc trái để phân biệt build trong giai đoạn test.
- CI bắt buộc kiểm tra HTML TB21 có `compactEssentials`, `essentialDisclosure`, `V4.8` và `/api/tts` sinh WAV tiếng Việt thật.
- Git/Vercel auto-deploy đã được xác nhận SUCCESS ở commit trigger nêu trên; kiểm tra cuối trên Xiaomi là nhìn badge `V4.8` và thử TTS nội bộ.

## 12. Quy trình chuẩn khi tiếp tục
1. Đọc `PROJECT_STATE.md` + `AGENTS.md`.
2. Đọc main + CI mới nhất.
3. Không tạo repo/project/Vercel URL mới nếu không có lý do đặc biệt.
4. Thay dữ liệu ở catalog/corpus trước; UI đọc dữ liệu đó.
5. Build + smoke-test `/vi`, TB 21, `/en`, compact markers và `/api/tts` WAV.
6. Chỉ merge/push bản đã test lên `main`; Vercel Git Integration tự deploy project cố định.
7. Xác nhận production bằng version badge trên stable URL; không gửi random deployment URL cho user.
8. Connector Vercel dùng để đọc logs/diagnostics khi có quyền; không dùng tạo project mới.
9. Update file này khi kiến trúc/quy tắc thay đổi.

## 13. Ưu tiên tiếp theo
1. Xác minh V4.8 trên Xiaomi 15 Ultra: badge góc trái phải hiện V4.8; controls phải mini; Android Auto phải dùng Internal TTS.
2. Nếu cần đọc deployment/logs trực tiếp trong ChatGPT, reconnect app Vercel trong ChatGPT vào đúng team `khoa-3f1b`.
3. Hoàn thiện full-text corpus hợp pháp cho 5 bộ và nhiều ngôn ngữ.
4. Local mirror/cache cho bản được phép phân phối.
5. Full-text search segment/chunk + highlight.
6. PDF mục lục/bookmarks/QR và font Pāli chuyên dụng khi có cách nhúng an toàn.
7. TTS highlight câu + nhớ vị trí nghe.
8. PWA/offline theo bộ/ngôn ngữ.
9. Sau đó mở rộng YouTube/SEO/AdSense.
