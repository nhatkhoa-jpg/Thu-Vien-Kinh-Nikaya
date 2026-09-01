# PROJECT STATE — 5 Đại Tạng Kinh Nikāya

> File này là **bộ nhớ dự án chính thức**. Mọi phiên ChatGPT/Codex mới phải đọc file này trước khi sửa dự án. Không khởi tạo lại kiến trúc nếu chưa đọc.

## 1. Mục tiêu lâu dài
Xây dựng một thư viện kinh Nikāya hiện đại, đa ngôn ngữ, thân thiện điện thoại/tablet/DeX/PC/màn hình rộng, có thể tái sử dụng làm mẫu cho các bộ kinh/tôn giáo khác. Người dùng phải đọc, nghe, tìm kiếm, lưu tiến độ và tải tài liệu ngay trên hệ thống, hạn chế tối đa việc bị đẩy sang website khác.

Repo chính: `nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya`
Framework: Next.js 16 + React 19 + TypeScript.
Hosting mục tiêu: Vercel.
Release marker hiện tại: **V4.7**.

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
- Header luôn render `data-release="V4.7"`; mobile menu cũng hiện `V4.7`, dùng để xác nhận production đúng build.

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
- Project mong muốn: `nikaya-reader-v4-final`.
- Stable URL mong muốn: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
- URL random chỉ là deployment URL nội bộ, không đưa cho user làm URL chính.
- Canonical/SEO dùng `lib/site.ts` -> `SITE_URL`; khi có custom domain chỉ đổi `NEXT_PUBLIC_SITE_URL`.

### BLOCKER QUAN TRỌNG — production alias đang stale
- Vercel connector `list_projects(team_nvItVeb65CDpWnfRA7KPlYZA)` và `list_projects('khoa-3f1b')` đều trả **0 projects**.
- `get_project('nikaya-reader-v4-final')`, `get_deployment(stable alias)` và get deployment theo các ID vừa tạo đều trả **404 not_found**.
- `deploy_to_vercel()` vẫn trả thông báo `Deployment created`, nhưng vì read-back không thấy deployment/project và Xiaomi vẫn hiển thị UI cũ, **không được coi các lệnh này là production thành công**.
- GitHub repo chỉ có `.github/workflows/build.yml`; không có Vercel deployment workflow, và GitHub commits không có Vercel deployment status. Git integration hiện không được xác nhận hoạt động.
- Để deploy chuẩn vào stable alias cần Vercel connection nhìn thấy project thật, hoặc CI có `VERCEL_TOKEN + VERCEL_ORG_ID + VERCEL_PROJECT_ID`.
- Khi quyền được sửa: build/test -> preview -> verify -> promote cùng project -> verify stable alias -> mới báo user.

## 11. Tình trạng source hiện tại (2026-09-01)
- TB 21 là bài test chính; TB 10/TB 22 và bài ở 4 tạng khác dùng kiểm thử navigation/data.
- Source V4.7 đã có mini toolbar + mini Nghe/PDF/MP3, khác rõ screenshot production cũ có các khối control lớn.
- Android Auto TTS đi thẳng internal TTS + audio unlock.
- **Latest validated source commit:** `53b27a3f63061753db418ff714f33ce22c462358`.
- **GitHub Actions run `33512553369`: PASS toàn bộ**: install, RAG validation, Next build, HTML TB21 chứa `compactEssentials` + `essentialDisclosure` + `V4.7`, `/en` smoke test, và `/api/tts` tạo WAV tiếng Việt có `RIFF` + >1000 bytes.
- Production stable alias hiện phải xem là **STALE/UNVERIFIED**. Không bảo user refresh/test alias cho đến khi alias được verify thực sự có V4.7.

## 12. Quy trình chuẩn khi tiếp tục
1. Đọc `PROJECT_STATE.md` + `AGENTS.md`.
2. Đọc main + CI mới nhất.
3. Không tạo repo/project/Vercel URL mới nếu không có lý do đặc biệt.
4. Thay dữ liệu ở catalog/corpus trước; UI đọc dữ liệu đó.
5. Build + smoke-test `/vi`, TB 21, `/en`, compact markers và `/api/tts` WAV.
6. Không gọi Vercel deployment là thành công nếu không read-back/verify được stable alias.
7. Không gửi random deployment URL cho user.
8. Update file này khi kiến trúc/quy tắc thay đổi.

## 13. Ưu tiên tiếp theo
1. Khôi phục quyền quản lý project Vercel thật hoặc thiết lập CI Vercel chính thức để stable alias luôn theo `main`.
2. Xác minh V4.7 trên Xiaomi 15 Ultra: controls phải mini; menu phải hiện V4.7; Android Auto phải dùng Internal TTS.
3. Hoàn thiện full-text corpus hợp pháp cho 5 bộ và nhiều ngôn ngữ.
4. Local mirror/cache cho bản được phép phân phối.
5. Full-text search segment/chunk + highlight.
6. PDF mục lục/bookmarks/QR và font Pāli chuyên dụng khi có cách nhúng an toàn.
7. TTS highlight câu + nhớ vị trí nghe.
8. PWA/offline theo bộ/ngôn ngữ.
9. Sau đó mở rộng YouTube/SEO/AdSense.
