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

### Trung Bộ tiếng Việt — v1
- Release tag: `mn-vi-audio-v1`.
- Asset bắt buộc chính xác: `mn1.mp3` … `mn152.mp3`.
- Workflow audio: `.github/workflows/build-mn-audio.yml` (`Build Full Trung Bo MP3`).
- Workflow finalizer: `.github/workflows/finalize-mn-site.yml` (`Finalize Trung Bo Site After MP3`).
- Audio run #4 đã PASS và publish release sau khi kiểm tra exact MN1..MN152.
- Finalizer run #1 đã PASS và commit catalog/audio hoàn chỉnh ở commit `9566e290b1282508a881594101ecc30fa9ebdd8b` với message `feat(mn): complete 152-sutta catalog with prebuilt MP3`.
- `data/catalog/audio.json` mapping tiếng Việt trỏ đến release `mn-vi-audio-v1` và provider `5 Đại Tạng Kinh Nikāya`.
- Catalog Trung Bộ đã mở rộng từ demo lên đủ TB 1–TB 152.

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
- Trong giai đoạn test hiển thị version rất nhỏ: `V5.0-MN-STAGE`.

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
- Quality gate V5 kiểm tra RAG/Knowledge export theo số catalog hiện tại và kiểm tra đủ 152 mapping MP3 Trung Bộ khi MN đạt 152 bài.

## 9. Vercel / domain — URL CỐ ĐỊNH
- Không tạo project Vercel mới cho mỗi phiên bản.
- Project cố định: `nikaya-reader-v4-final`.
- Stable URL: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
- Vercel Git Integration nối repo GitHub; production branch `main`; push/merge lên `main` tự deploy vào cùng project/URL.
- URL random chỉ là deployment nội bộ, không đưa làm URL chính.

## 10. Tình trạng source hiện tại (2026-09-02)
Branch hoàn thiện Trung Bộ: `feature/mn-prebuilt-mp3`.
PR: #2 `V5: Hoàn thiện Trung Bộ 152 bài với MP3 dựng sẵn`.

Đã hoàn tất trên branch:
- Release MP3 Trung Bộ tiếng Việt đã publish và workflow xác minh exact 152/152.
- Catalog TB 1–TB 152 + audio mapping được finalizer sinh và commit.
- RAG export + Next build + MP3-first smoke test đã chạy trong finalizer thành công trước commit catalog.
- Route `/api/tts` được quality gate V5 kỳ vọng trả 404; browser/server neural TTS không còn là runtime chính.
- Reader marker kiểm thử: `primaryMp3Disclosure` và `V5.0-MN-STAGE`.

Việc còn lại trước production:
1. Chạy quality gate lại trên **HEAD cuối cùng do user/connector commit** để tránh GitHub `action_required` ở commit bot.
2. Xác minh PR #2 mergeable và các check mới PASS.
3. Mark PR ready, merge vào `main` khi tất cả gate xanh.
4. Xác minh Vercel production trên stable URL cố định và player/route chính hoạt động.
5. Sau khi production xác minh xong, đổi trạng thái V5 Trung Bộ thành hoàn tất và tiếp tục bộ kế tiếp trong phiên/dự án khác.

## 11. Quy trình chuẩn khi tiếp tục
1. Đọc `PROJECT_STATE.md`, `AGENTS.md`, `README.md`, `data/README.md`.
2. Đọc branch/main + GitHub Actions mới nhất.
3. Không tạo repo/project/Vercel URL mới nếu không có lý do đặc biệt.
4. Data/catalog trước; UI đọc dữ liệu đó.
5. Build + RAG + MP3 catalog validation + smoke-test reader.
6. Chỉ merge vào `main` sau khi HEAD cuối cùng có quality gate xanh.
7. Vercel Git Integration tự deploy project cố định.
8. Xác nhận production bằng stable URL; không gửi random deployment URL.
9. Update file này khi kiến trúc/quy tắc thay đổi.

## 12. Ưu tiên tiếp theo sau khi V5 Trung Bộ production PASS
- Hoàn thiện full-text corpus hợp pháp và audio prebuilt cho các bộ còn lại theo cùng pipeline.
- Nâng chất lượng giọng Việt bằng cách re-render asset server-side; không bắt client tải model.
- Full-text search segment/chunk + highlight.
- PDF mục lục/bookmarks/QR và font Pāli chuyên dụng khi có cách nhúng an toàn.
- PWA/offline theo bộ/ngôn ngữ.
- Sau đó mở rộng YouTube/SEO/AdSense.
