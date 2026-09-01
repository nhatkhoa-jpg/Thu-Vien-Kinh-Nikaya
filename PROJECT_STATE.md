# PROJECT STATE — 5 Đại Tạng Kinh Nikāya

> File này là **bộ nhớ dự án chính thức**. Mọi phiên ChatGPT/Codex mới phải đọc file này trước khi sửa dự án. Không khởi tạo lại kiến trúc nếu chưa đọc.

## 1. Mục tiêu lâu dài
Xây dựng một thư viện kinh Nikāya hiện đại, đa ngôn ngữ, thân thiện điện thoại/tablet/DeX/PC/màn hình rộng. Người dùng phải đọc, nghe, tìm kiếm, sưu tầm đoạn kinh, lưu tiến độ và tải tài liệu ngay trên hệ thống, hạn chế tối đa việc bị đẩy sang website khác.

Repo chính: `nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya`
Framework: Next.js 16 + React 19 + TypeScript.
Hosting: Vercel.
Project cố định: `nikaya-reader-v4-final`.
Stable URL: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
Release marker đang kiểm thử: **V5.1-HOME-DN**.

## 2. Tên thương hiệu và mã hiển thị Việt
Tên hiển thị: **5 Đại Tạng Kinh Nikāya**.
Trên các bề mặt khám phá/search/navigation tiếng Việt phải ưu tiên **tên đầy đủ** để người mới dễ hiểu: Trường Bộ, Trung Bộ, Tương Ưng Bộ, Tăng Chi Bộ, Tiểu Bộ. Mobile được xuống dòng; desktop/laptop giữ một dòng khi đủ chỗ.
Mã Việt vẫn là mã chính trên trang bài; mã Pāli/quốc tế chỉ hiện nhỏ để đối chiếu:
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
Kiến trúc V4 dùng browser/server neural TTS đã bị thay thế.
1. **MP3 dựng sẵn một lần là nguồn nghe chính.** Mỗi bài render trước, lưu ở release/CDN ổn định và mọi thiết bị stream cùng một file.
2. **Device Web Speech API là tùy chọn phụ.** Chỉ hiện khi thiết bị có voice đúng ngôn ngữ; nếu không có thì ẩn.
3. Không re-introduce neural/WASM TTS chạy trong browser hoặc server runtime TTS làm đường nghe chính.
4. Player MP3 giữ tốc độ 0.75×–2×, tua ±15 giây và lưu vị trí nghe.

### Trung Bộ tiếng Việt — HOÀN TẤT PRODUCTION
- Release tag `mn-vi-audio-v1`, exact `mn1.mp3` … `mn152.mp3`.
- Catalog TB1–TB152 + 152 audio mapping hoàn tất.
- Quality gate staging/main PASS; PR #2 merged; Vercel production SUCCESS.
- Reader production wording: `Nghe bài kinh · MP3 dựng sẵn · mọi thiết bị`.
- Nguồn rút gọn: `Bản dịch: <dịch giả> · Đối chiếu SuttaCentral`.

### Trường Bộ tiếng Việt — ĐANG RENDER THẬT
- Branch checkpoint: `feature/progress-home-dn`.
- Workflow: `.github/workflows/build-dn-audio.yml` — `Build Full Truong Bo MP3`.
- Run đang theo dõi: `33568279112`.
- Release checkpoint: tag `dn-vi-audio-v1`, release id `380866944`.
- Mục tiêu exact: `dn1.mp3` … `dn34.mp3`.
- 6 shard đang chạy song song: DN1–6, DN7–12, DN13–18, DN19–24, DN25–29, DN30–34.
- Init-release đã PASS; các shard đang ở bước render. Asset chỉ upload sau khi file từng shard render/validate xong, nên release có thể tạm thời hiển thị 0 asset trong lúc render.
- Pipeline dùng checkpoint: lần chạy sau bỏ qua `dnN.mp3` đã upload hợp lệ.

## 5. PDF
- PDF chính do website tự sinh từ toàn văn bằng `pdfmake`.
- Không dùng PDF nguồn ngoài làm bản chính.
- Web giữ Pāli chuẩn; PDF có fallback glyph khi cần.

## 6. Reader UX / sưu tầm
- Header: Trang chủ, 5 Đại Tạng, Tìm kinh, Nghe, Tiến độ, global search, ngôn ngữ, mobile menu.
- Trang bài: Home/Library, trước/sau, jump-to-discourse.
- Search hiện tìm mã, tên, Pāli, chủ đề, summary/practice; full-text segment search toàn corpus vẫn là bước tiếp theo khi corpus được materialize đủ.
- Reader controls gọn: font, line-height, width, dark, bookmark/resume vị trí.
- **Sưu tầm đoạn kinh V5.1:** mỗi segment toàn văn có bookmark + copy; lưu localStorage theo canonicalRef + segmentId. Trang `/{locale}/bo-suu-tap` liệt kê các đoạn đã lưu trên thiết bị. Chưa có cloud sync/account.
- MP3 là disclosure nghe chính; PDF riêng; device speech chỉ xuất hiện nếu supported.
- Trong giai đoạn test hiển thị version nhỏ `V5.1-HOME-DN`.

## 7. Homepage / discovery V5.1
- Thứ tự: Hero → 5 bộ kinh → Tìm kinh & tra cứu → Bài gợi ý.
- Collection card phải lọc đúng collection, không chỉ nhảy cùng một anchor.
- Collection chips dùng tên đầy đủ; mã Việt/quốc tế là secondary.
- Bỏ filter PDF nguồn ngoài gây hiểu nhầm. Format filter hiện `Tất cả / Có MP3`.
- Có link `Tiến độ số hóa` và route `/{locale}/tien-do`.
- Progress page đọc GitHub Actions/release: trạng thái job, số MP3 release, hoạt động gần đây và link trực tiếp GitHub Actions.
- V5.1 PR #3 merged vào `main` bằng commit `c1a782c432d0d4a2241a939c7f053a083e95da2c`.
- Main Build & Validate run `33568862972` PASS; Vercel production cho merge commit báo SUCCESS.

## 8. Responsive UX
Bắt buộc test ít nhất 4 lớp:
- Phone <= 640px
- Tablet/DeX 641–1024px
- Desktop 1025–1499px
- Wide >= 1500px
Mobile bottom dock không được che nội dung/nút quan trọng. Tên đầy đủ 5 bộ được phép wrap trên mobile.

## 9. Dữ liệu website + RAG/AI
- Nguồn chuẩn: `data/catalog/*.json`.
- Mỗi bài giữ ID ổn định, canonical ref, code quốc tế, viCode, title, Pāli, topics, source, translator/license, version.
- RAG export: `npm run rag:export`.
- Mỗi chunk có stable id + `content_hash` + `embedding_cache_key`.
- Quality gate kiểm tra số catalog/audio thực tế; không hard-code giả định số lượng cho SN/AN/KN trước khi khám phá canonical refs.

## 10. YouTube — nguyên tắc tích hợp
- Reader đã có khả năng render video theo `youtubeId` như nội dung bổ sung; YouTube không được biến homepage thành feed chính.
- Không sửa thủ công JSX từng trang. Dữ liệu video phải map theo canonicalRef/videoId trong catalog (ưu tiên tách `videos.json` khi triển khai lớn).
- Giai đoạn tự động hóa: YouTube Data API scan video của channel, đọc mã cấu trúc trong title/description như `TB 21`, `MN 21`, `TrB 1`, map vào canonicalRef; trường hợp mơ hồ cho manual override.
- Nên hỗ trợ `startSeconds/endSeconds`, title, role/topic để một video hoặc trích đoạn gắn đúng bài/đoạn.

## 11. Vercel / domain — URL CỐ ĐỊNH
- Không tạo project Vercel mới cho mỗi phiên bản.
- Project cố định: `nikaya-reader-v4-final`.
- Stable URL: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
- Vercel Git Integration nối repo GitHub; production branch `main`; merge main tự deploy cùng project/URL.
- URL random chỉ là deployment nội bộ, không đưa làm URL chính.
- Nếu production cần public cho người ngoài, `Require Log In` của Deployment Protection phải tắt; kiểm tra lại bằng tab ẩn danh.

## 12. Cách người dùng theo dõi công việc
- Dễ xem trên website: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app/vi/tien-do`.
- Nguồn kỹ thuật chính xác nhất: `https://github.com/nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya/actions`.
- Chỉ coi “đang làm” khi GitHub workflow/job là `queued` hoặc `in_progress`; automation ChatGPT bật một mình không phải bằng chứng công việc đang chạy.

## 13. Quy trình chuẩn khi tiếp tục
1. Đọc `PROJECT_STATE.md`, `AGENTS.md`, `README.md`, `data/README.md`.
2. Đọc `main` + GitHub Actions/release mới nhất.
3. Không tạo repo/project/Vercel URL mới nếu không có lý do đặc biệt.
4. Data/catalog trước; UI đọc dữ liệu đó.
5. Build + RAG + MP3 catalog validation + smoke-test reader.
6. Chỉ merge vào `main` sau khi HEAD cuối cùng có quality gate xanh.
7. Vercel Git Integration tự deploy project cố định.
8. Xác nhận production bằng stable URL; không gửi random deployment URL.
9. Update file này khi kiến trúc/quy tắc/trạng thái một bộ thay đổi.

## 14. Thứ tự tiếp theo
- Hoàn tất Trường Bộ DN/TrB → Tương Ưng Bộ SN/TƯB → Tăng Chi Bộ AN/TCB → Tiểu Bộ KN/TiB.
- Full-text segment search + highlight khi corpus hợp pháp được materialize đủ.
- Cloud sync cho bộ sưu tập đoạn kinh nếu sau này có tài khoản.
- YouTube importer/catalog theo canonicalRef.
- PDF mục lục/bookmarks/QR, PWA/offline, sau đó SEO/AdSense.
