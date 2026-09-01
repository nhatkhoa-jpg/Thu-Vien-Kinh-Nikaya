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

## 4. Nghe — kiến trúc 3 tầng
1. **Device/Browser TTS** bằng Web Speech API khi thiết bị có voice thật.
2. **Internal TTS** của chính thư viện bằng `text2wav` + eSpeak-NG trên server, trả WAV cho browser. Đây là fallback bắt buộc khi Chrome/Xiaomi không expose voice; không phụ thuộc MP3 ngoài.
3. **MP3 bổ sung** đúng ngôn ngữ khi có nguồn đáng tin; chỉ là lựa chọn thêm.

Quy tắc:
- Auto ưu tiên giọng thiết bị; nếu không có voice hoặc engine fail thì chuyển sang internal TTS.
- Internal TTS chia toàn văn thành chunk ~210 ký tự, POST `/api/tts`, phát WAV tuần tự bằng `Audio` trong browser.
- API TTS giới hạn text/chunk, locale/voice cố định theo whitelist và chạy Node runtime.
- CI phải POST câu tiếng Việt vào `/api/tts`, kiểm tra WAV có header `RIFF` và >1000 bytes; không được coi build xanh nếu TTS runtime chưa tạo âm thanh thật.
- Player MP3 giữ chỉnh tốc độ 0.75×–2× và tua ±15 giây.

### Android/Chrome TTS
- Không set UI sang “đang đọc” trước `onstart` khi dùng device voice.
- Không để voice reload cancel phiên đọc.
- Nếu Chrome trả `getVoices()=[]`, Auto chuyển thẳng internal TTS thay vì giả trạng thái đang đọc.
- Nếu device voice fail giữa phiên và mode Auto, chuyển internal TTS.

## 5. PDF
- PDF chính do website tự sinh từ toàn văn thư viện bằng `pdfmake`.
- Typography hiện: title ~34pt, summary ~14.2pt, body ~13pt, segment markers, summary card, header/footer, số trang và màu nhận diện.
- Text normalize NFC, loại zero-width + replacement chars.
- Do Roboto PDF thiếu một số glyph Pāli Extended, PDF dùng fallback Latin cho các ký tự Pāli dễ vỡ (`ṇ→n`, `ḍ→d`, `ṭ→t`, `ā→a`...). **Web vẫn giữ Pāli chuẩn**; chỉ PDF fallback để không có ô vuông.
- Không dùng PDF nguồn ngoài làm bản chính.

## 6. Reader UX / điều hướng
- Header: Trang chủ, 5 Đại Tạng, Thư viện, Nghe, global search, ngôn ngữ, mobile menu.
- Trang bài: Home/Library, trước/sau, jump-to-discourse.
- Search: mã Việt/quốc tế, tên, Pāli, chủ đề, tóm tắt.
- **Reader controls phải gọn:** font −/+, line-height, width, dark mode, bookmark/resume là icon mini có tooltip/title; không chiếm một khối lớn trước nội dung.
- **Nghe / PDF / MP3 là 3 nút mini dạng disclosure** ngay dưới title. Mặc định đóng để người đọc thấy nội dung sớm; bấm mới bung panel chức năng. Desktop dùng tooltip, mobile dùng nhãn ngắn.

## 7. Responsive UX
Bắt buộc test ít nhất 4 lớp:
- Phone <= 640px
- Tablet/DeX 641–1024px
- Desktop 1025–1499px
- Wide >= 1500px
Mobile có bottom dock; không để dock che nội dung/nút quan trọng. `reader-width` lưu trong localStorage không được làm nội dung rộng hơn viewport; reader/full text luôn max-width 100% trên mobile.

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
- **Không tạo project Vercel mới cho mỗi phiên bản.**
- Project cố định: `nikaya-reader-v4-final`.
- Stable URL: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
- URL có chuỗi random chỉ là deployment URL nội bộ, không đưa cho user làm URL chính.
- Mọi update deploy production vào cùng project.
- Canonical/SEO dùng `lib/site.ts` -> `SITE_URL`; khi có custom domain chỉ đổi `NEXT_PUBLIC_SITE_URL`.

## 11. Tình trạng hiện tại (2026-09-01)
- TB 21 là bài test chính; TB 10/TB 22 và bài ở 4 tạng khác dùng kiểm thử navigation/data.
- Reader controls đã chuyển sang mini toolbar; Nghe/PDF/MP3 đã chuyển sang mini disclosure để nội dung xuất hiện sớm.
- TTS device trên Xiaomi 15 Ultra không có voice usable; đã bổ sung internal eSpeak-NG fallback tự chủ.
- API `/api/tts` đã được Next externalize `text2wav` và trace toàn bộ `lib/**/*` + `espeak-ng-data/**/*` để giữ WASM/voice runtime.
- **Latest validated code commit:** `1a21fd8165ba9e134691c25cf8f25a2723187921`.
- **GitHub Actions run `33510373644`: PASS toàn bộ**, gồm npm install, RAG validation, Next build, route smoke tests và **internal Vietnamese TTS WAV runtime test**.
- Production deployment đã gửi vào project cố định: `dpl_JBgykxmbvAvQB6Nzb5ca4SxqPn8n`; stable alias vẫn `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
- Vercel connector vẫn có bug read-back 404 sau create deployment; không được vì lỗi connector mà tạo project mới.

## 12. Quy trình chuẩn khi tiếp tục
1. Đọc `PROJECT_STATE.md` + `AGENTS.md`.
2. Đọc main + CI mới nhất.
3. Không tạo repo/project/Vercel URL mới nếu không có lý do đặc biệt.
4. Thay dữ liệu ở catalog/corpus trước; UI đọc dữ liệu đó.
5. Build + smoke-test `/vi`, TB 21, `/en` và `/api/tts` WAV.
6. Chỉ deploy commit xanh vào `nikaya-reader-v4-final`.
7. Không gửi random deployment URL cho user.
8. Update file này khi kiến trúc/quy tắc thay đổi.

## 13. Ưu tiên tiếp theo
1. Test internal TTS thật trên Xiaomi 15 Ultra; nếu giọng eSpeak quá máy móc, thêm engine local/browser thứ hai nhưng vẫn tự chủ.
2. Hoàn thiện full-text corpus hợp pháp cho 5 bộ và nhiều ngôn ngữ.
3. Local mirror/cache cho bản được phép phân phối.
4. Full-text search segment/chunk + highlight.
5. PDF mục lục/bookmarks/QR và font Pāli chuyên dụng khi có cách nhúng an toàn.
6. TTS highlight câu + nhớ vị trí nghe.
7. PWA/offline theo bộ/ngôn ngữ.
8. Sau đó mở rộng YouTube/SEO/AdSense.
