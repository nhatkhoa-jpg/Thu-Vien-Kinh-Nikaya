# PROJECT STATE — 5 Đại Tạng Kinh Nikāya

> File này là **bộ nhớ dự án chính thức**. Mọi phiên ChatGPT/Codex mới phải đọc file này trước khi sửa dự án. Không khởi tạo lại kiến trúc nếu chưa đọc.

## 1. Mục tiêu lâu dài
Xây dựng một thư viện kinh Nikāya hiện đại, đa ngôn ngữ, thân thiện điện thoại/tablet/DeX/PC/màn hình rộng. Người dùng phải đọc, nghe, tìm kiếm, lưu tiến độ và tải tài liệu ngay trên hệ thống, hạn chế tối đa việc bị đẩy sang website khác.

Repo chính: `nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya`
Framework: Next.js 16 + React 19 + TypeScript.
Hosting: Vercel.
Project cố định: `nikaya-reader-v4-final`.
Stable URL: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
Release marker đang kiểm thử: **V5.0-MN-STAGE**.

## 2. Tên thương hiệu và mã hiển thị Việt
Tên hiển thị: **5 Đại Tạng Kinh Nikāya**.
Mã Việt là mã chính trên giao diện tiếng Việt; mã Pāli/quốc tế chỉ hiện nhỏ để đối chiếu:
- TrB = Trường Bộ (DN)
- TB = Trung Bộ (MN)
- TƯB = Tương Ưng Bộ (SN)
- TCB = Tăng Chi Bộ (AN)
- TiB = Tiểu Bộ (KN)

## 3. Nguyên tắc nội dung
- Trang bài ưu tiên **toàn văn ngay trong thư viện** cho ngôn ngữ đang chọn.
- Link nguồn chỉ dùng cho provenance/đối chiếu.
- Không tự fallback sang ngôn ngữ khác khiến người dùng hiểu nhầm.
- Metadata nguồn/người dịch/license phải đi cùng dữ liệu.
- `data/catalog/*.json` là nguồn chuẩn metadata; không hard-code corpus lớn trong React.

## 4. Nghe — kiến trúc V5 MP3-first
Kiến trúc V4.10 dùng browser/server TTS đã bị thay thế.

Thứ tự V5:
1. **MP3 dựng sẵn một lần là nguồn nghe chính.** Mỗi bài được render trước, lưu ở release/CDN ổn định và mọi thiết bị chỉ stream cùng một file.
2. **Device Web Speech API là tùy chọn phụ.** Chỉ hiện khi thiết bị hiện tại có voice đúng ngôn ngữ; nếu không có thì ẩn hoàn toàn.
3. Không re-introduce neural/WASM TTS chạy trong browser hoặc server runtime TTS làm đường nghe chính.
4. Player MP3 giữ tốc độ 0.75×–2×, tua ±15 giây và lưu vị trí nghe.

### Trung Bộ tiếng Việt — v1 — HOÀN TẤT PRODUCTION
- Release tag: `mn-vi-audio-v1`.
- Asset bắt buộc chính xác: `mn1.mp3` … `mn152.mp3`.
- Workflow audio: `.github/workflows/build-mn-audio.yml` (`Build Full Trung Bo MP3`).
- Workflow finalizer: `.github/workflows/finalize-mn-site.yml` (`Finalize Trung Bo Site After MP3`).
- Audio run #4 PASS và release xác minh exact 152/152.
- Finalizer #1 PASS; catalog/audio hoàn chỉnh được sinh ở commit `9566e290b1282508a881594101ecc30fa9ebdd8b`.
- `data/catalog/audio.json` có 152 mapping tiếng Việt trỏ đến `mn-vi-audio-v1`, provider `5 Đại Tạng Kinh Nikāya`.
- Catalog Trung Bộ đủ TB 1–TB 152.
- Quality gate staging run `33563043660` PASS: RAG, Next build, reader smoke, `mn21.mp3`, wording MP3-first, `/api/tts` 404 và download range MP3 thật.
- PR #2 merged vào `main` bằng merge commit `c7c8abf27e1eb533348c3054f475cc9fc06f0b8f`.
- Production Vercel cho merge commit báo SUCCESS trên project cố định `nikaya-reader-v4-final`.
- Main quality gate run `33563158405` PASS toàn bộ.
- Reader production wording: MP3 chính hiển thị `Nghe bài kinh · MP3 dựng sẵn · mọi thiết bị`; device speech chỉ hiện khi có voice phù hợp.
- Nguồn được rút gọn chuyên nghiệp: `Bản dịch: <dịch giả> · Đối chiếu SuttaCentral`; bỏ card nguồn trùng lặp.

## 5. PDF
- PDF chính do website tự sinh từ toàn văn bằng `pdfmake`.
- Không dùng PDF nguồn ngoài làm bản chính.
- Web giữ Pāli chuẩn; PDF có fallback glyph khi cần.

## 6. Reader UX / điều hướng
- Header: Trang chủ, 5 Đại Tạng, Thư viện, Nghe, global search, ngôn ngữ, mobile menu.
- Trang bài: Home/Library, trước/sau, jump-to-discourse.
- Search: mã Việt/quốc tế, tên, Pāli, chủ đề, tóm tắt.
- Reader controls gọn: font, line-height, width, dark, bookmark/resume.
- MP3 là disclosure nghe chính; PDF riêng; device speech chỉ xuất hiện nếu supported.
- Trong giai đoạn test vẫn hiển thị version nhỏ `V5.0-MN-STAGE`; chỉ xóa sau khi user xác nhận UI/MP3 production ổn.

## 7. Responsive UX
Bắt buộc test ít nhất 4 lớp:
- Phone <= 640px
- Tablet/DeX 641–1024px
- Desktop 1025–1499px
- Wide >= 1500px
Mobile bottom dock không được che nội dung/nút quan trọng.

## 8. Dữ liệu website + RAG/AI
- Nguồn chuẩn: `data/catalog/*.json`.
- Mỗi bài giữ ID ổn định, canonical ref, code quốc tế, viCode, title, Pāli, topics, source, translator/license, version.
- RAG export: `npm run rag:export`.
- Mỗi chunk có stable id + `content_hash` + `embedding_cache_key`.
- Quality gate kiểm tra số catalog/audio thực tế; không hard-code giả định số lượng cho các bộ chưa khám phá canonical refs.

## 9. Vercel / domain — URL CỐ ĐỊNH
- Không tạo project Vercel mới cho mỗi phiên bản.
- Project cố định: `nikaya-reader-v4-final`.
- Stable URL: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
- Vercel Git Integration nối repo GitHub; production branch `main`; push/merge lên `main` tự deploy vào cùng project/URL.
- URL random chỉ là deployment nội bộ, không đưa làm URL chính.

## 10. Tình trạng source hiện tại (2026-09-02)
`main` đã chứa V5 MP3-first cho Trung Bộ.

Hoàn tất:
- Trung Bộ TB1–TB152: catalog 152/152.
- MP3 Việt dựng sẵn: 152/152.
- Release + manifest: PASS.
- RAG + Next build + reader smoke: PASS staging và main.
- Vercel production: SUCCESS trên stable project.
- Browser/server neural TTS runtime đã loại khỏi đường nghe chính; `/api/tts` không còn là runtime.
- Nguồn/đối chiếu đã rút gọn và bỏ duplicate card.

Đang tiếp tục theo tác vụ master `Hoàn tất 5 Đại Tạng Nikāya`:
1. Trường Bộ DN/TrB.
2. Tương Ưng Bộ SN/TƯB.
3. Tăng Chi Bộ AN/TCB.
4. Tiểu Bộ KN/TiB.

Mỗi bộ phải khám phá canonical refs từ nguồn chuẩn, checkpoint bằng release/catalog, render MP3 server-side theo batch và chỉ production khi quality gate xanh.

## 11. Quy trình chuẩn khi tiếp tục
1. Đọc `PROJECT_STATE.md`, `AGENTS.md`, `README.md`, `data/README.md`.
2. Đọc `main` + GitHub Actions/release mới nhất.
3. Không tạo repo/project/Vercel URL mới nếu không có lý do đặc biệt.
4. Data/catalog trước; UI đọc dữ liệu đó.
5. Build + RAG + MP3 catalog validation + smoke-test reader.
6. Chỉ merge vào `main` sau khi HEAD cuối cùng có quality gate xanh.
7. Vercel Git Integration tự deploy project cố định.
8. Xác nhận production bằng stable URL; không gửi random deployment URL.
9. Update file này khi kiến trúc/quy tắc/trạng thái một bộ thay đổi.

## 12. Ưu tiên tiếp theo
- Tiếp tục Trường Bộ theo cùng pipeline MP3-first, sau đó SN → AN → KN.
- Hoàn thiện full-text corpus hợp pháp cho từng bộ.
- Nâng chất lượng giọng Việt bằng cách re-render asset server-side; không bắt client tải model.
- Full-text search segment/chunk + highlight.
- PDF mục lục/bookmarks/QR và font Pāli chuyên dụng khi có cách nhúng an toàn.
- PWA/offline theo bộ/ngôn ngữ.
- Sau đó mở rộng YouTube/SEO/AdSense.
