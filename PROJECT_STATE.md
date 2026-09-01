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

## 5. PDF
- Không dùng PDF bên ngoài làm bản chính trên UI.
- Website tự sinh PDF từ chính nội dung hiện đang có trong thư viện.
- PDF phải có bìa/branding, mã Việt, tên kinh, Pāli, tóm lược, toàn văn, nguồn, số trang, màu nhận diện và typography rõ.
- Hiện dùng `pdfmake` tải động phía client để tránh tăng bundle trang đọc.

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

## 8. Dữ liệu dùng cho website + RAG/AI
Nguồn chuẩn metadata: `data/catalog/*.json`.
Không nhét nội dung quan trọng chỉ trong JSX/HTML.
Mỗi bài giữ ID ổn định, canonical ref, code quốc tế, viCode, title, Pāli, topics, source, translator/license, version.
RAG export: `npm run rag:export`.
Mỗi chunk phải có stable id + `content_hash` + `embedding_cache_key`, để chỉ re-embed đoạn thay đổi.
Mục tiêu tương thích LangChain, LlamaIndex, OpenWebUI, Chroma, Qdrant, FAISS, Milvus, Weaviate, pgvector và local LLM.

## 9. YouTube
YouTube không được biến trang chủ thành feed. Chỉ gắn video thật sự liên quan tại trang bài kinh/chủ đề, dùng lazy-load và `youtube-nocookie`, phục vụ minh họa, SEO và traffic chéo.

## 10. Tình trạng hiện tại (2026-09-01)
- UI V2/V3 đã có responsive, reader controls, audio player, i18n, mã Việt, RAG-ready catalog.
- Các bài test gồm TB 10, TB 21, TB 22 và một số bài ở TrB/TƯB/TCB/TiB.
- TB 21 là bài kiểm thử chính.
- Đã bổ sung Browser TTS, PDF tự sinh, global search/menu, quick jump reader trong source mới.
- GitHub Actions phải chạy: npm install -> RAG export/validate -> next build -> smoke tests.

## 11. Quy trình chuẩn khi tiếp tục dự án
1. Đọc `PROJECT_STATE.md` và `AGENTS.md`.
2. Đọc commit/main hiện tại và CI gần nhất.
3. Không tạo project/repo mới nếu chưa cần.
4. Thay đổi dữ liệu ở catalog/corpus trước; UI chỉ đọc dữ liệu đó.
5. Build + smoke-test mobile reader TB 21 và home `/vi`.
6. Chỉ deploy commit đã xanh.
7. Cập nhật mục "Tình trạng hiện tại" trong file này nếu kiến trúc/quy tắc thay đổi.

## 12. Ưu tiên tiếp theo
1. Hoàn thiện full-text corpus hợp pháp cho 5 bộ và nhiều ngôn ngữ.
2. Tạo local mirror/cache cho các bản được phép tái phân phối để giảm phụ thuộc nguồn ngoài.
3. Full-text search theo segment/chunk, highlight kết quả.
4. PDF template nâng cấp thêm mục lục, QR/canonical URL, chapter bookmarks.
5. Browser TTS nâng cấp highlight câu đang đọc và giữ vị trí nghe.
6. PWA/offline packages theo từng bộ/ngôn ngữ.
7. Sau đó mới mở rộng YouTube/SEO/AdSense.
