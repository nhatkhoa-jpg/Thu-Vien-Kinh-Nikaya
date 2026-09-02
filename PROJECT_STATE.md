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
- **Ưu tiên hoàn thiện corpus đọc/PDF trước audio.** Một bài được phép lên production khi toàn văn + metadata + PDF + navigation/search đã đạt quality gate, kể cả chưa có MP3.
- MP3 là lớp bổ sung bất đồng bộ: khi audio chất lượng cao xuất hiện, catalog tự nhận mapping và website cập nhật, không chặn tiến độ số hóa văn bản.

## 4. Nghe — kiến trúc V5 MP3-first, audio chất lượng cao
Kiến trúc V4 dùng browser/server neural TTS đã bị thay thế.
1. **MP3 dựng sẵn một lần là nguồn nghe chính.** Mỗi bài render trước, lưu ở release/CDN ổn định và mọi thiết bị stream cùng một file.
2. **Device Web Speech API là tùy chọn phụ.** Chỉ hiện khi thiết bị có voice đúng ngôn ngữ; nếu không có thì ẩn.
3. Không re-introduce neural/WASM TTS chạy trong browser hoặc server runtime TTS làm đường nghe chính.
4. Player MP3 giữ tốc độ 0.75×–2×, tua ±15 giây và lưu vị trí nghe.
5. **Không coi Piper hiện tại là audio final.** Các MP3 Piper đã tạo chỉ là checkpoint kỹ thuật/placeholder cho đến khi được thay bằng cloud voice đạt chuẩn nghe lâu.
6. Audio final ưu tiên cloud TTS chất lượng cao trong free tier hợp lệ (Google Cloud TTS/Chirp/Neural/WaveNet tùy quota thực tế, Azure Neural, AWS Polly hoặc nguồn miễn phí hợp lệ khác). Không lách quota/vi phạm điều khoản.
7. Pipeline audio phải có bước narration normalization: chuẩn hóa dấu câu, chia đoạn, pause, số/mã kinh, chữ viết tắt, thuật ngữ Phật học và từ Pāli trước khi gửi TTS.
8. Chỉ render những canonicalRef chưa có **audio final** hợp lệ; checkpoint theo từng file, hash, duration, provider/voice/version. Không render lại file final đã PASS.
9. Có thể chạy audio nhiều ngày/nhiều tháng theo quota miễn phí. Corpus văn bản/PDF vẫn tiếp tục độc lập và không chờ audio.
10. Không trộn giọng ngẫu nhiên trong cùng một bộ nếu tránh được; ưu tiên một master voice cho mỗi collection/version để trải nghiệm nghe nhất quán.

### Trung Bộ tiếng Việt
- Catalog TB1–TB152 đã có đủ 152 bài và mapping MP3 checkpoint.
- Release tag `mn-vi-audio-v1`, exact `mn1.mp3` … `mn152.mp3`.
- Quality gate staging/main từng PASS; PR #2 merged; Vercel production SUCCESS.
- **Audio hiện có chưa được xem là bản final về chất lượng giọng đọc.** Giữ nguyên để không mất công việc; sau này cloud-quality audio sẽ thay thế từng bài theo version mới.

### Trường Bộ tiếng Việt
- Release checkpoint tag `dn-vi-audio-v1`, release id `380866944`, đã có MP3 DN1–DN34.
- **MP3 34/34 không đồng nghĩa catalog website 34/34.** Production từng chỉ hiển thị 2 bài Trường Bộ (TrB16 và TrB31), vì vậy DN chưa được gọi là hoàn tất corpus cho tới khi đủ 34 bài toàn văn/catalog/PDF/reader.
- Việc ưu tiên hiện tại: materialize/validate đủ DN1–DN34 vào catalog + reader + PDF; không render lại 34 MP3 checkpoint.
- Sau DN corpus PASS, chuyển ngay SN → AN → KN theo data-first.

## 5. PDF
- PDF chính do website tự sinh từ toàn văn bằng `pdfmake`.
- Không dùng PDF nguồn ngoài làm bản chính.
- Web giữ Pāli chuẩn; PDF có fallback glyph khi cần.
- PDF phải hoạt động ngay cả khi bài chưa có MP3.

## 6. Reader UX / sưu tầm
- Header: Trang chủ, 5 Đại Tạng, Tìm kinh, Nghe, Tiến độ, global search, ngôn ngữ, mobile menu.
- Trang bài: Home/Library, trước/sau, jump-to-discourse.
- Search hiện tìm mã, tên, Pāli, chủ đề, summary/practice; full-text segment search toàn corpus vẫn là bước tiếp theo khi corpus được materialize đủ.
- Reader controls gọn: font, line-height, width, dark, bookmark/resume vị trí.
- **Sưu tầm đoạn kinh V5.1:** mỗi segment toàn văn có bookmark + copy; lưu localStorage theo canonicalRef + segmentId. Trang `/{locale}/bo-suu-tap` liệt kê các đoạn đã lưu trên thiết bị. Chưa có cloud sync/account.
- MP3 là disclosure nghe chính khi có audio final/checkpoint; PDF riêng; device speech chỉ xuất hiện nếu supported.
- Bài chưa có MP3 vẫn phải đọc và tải PDF bình thường; không hiện nút nghe giả hoặc lỗi.
- Trong giai đoạn test hiển thị version nhỏ `V5.1-HOME-DN`.

## 7. Homepage / discovery V5.1
- Thứ tự: Hero → 5 bộ kinh → Tìm kinh & tra cứu → Bài gợi ý.
- Collection card phải lọc đúng collection, không chỉ nhảy cùng một anchor.
- Collection chips dùng tên đầy đủ; mã Việt/quốc tế là secondary.
- Bỏ filter PDF nguồn ngoài gây hiểu nhầm. Format filter hiện `Tất cả / Có MP3`.
- Có link `Tiến độ số hóa` và route `/{locale}/tien-do`.
- Progress page phải phân biệt rõ: **Corpus toàn văn/PDF** và **Audio MP3**. Không ghi “hoàn tất bộ kinh” chỉ vì MP3 đủ nếu catalog toàn văn chưa đủ.
- Progress page đọc GitHub Actions/release: trạng thái job, số MP3 release, hoạt động gần đây và link trực tiếp GitHub Actions.
- V5.1 PR #3 merged vào `main` bằng commit `c1a782c432d0d4a2241a939c7f053a083e95da2c`.
- Main Build & Validate run `33568862972` PASS; Vercel production cho merge commit báo SUCCESS.

## 8. Chiến lược ngôn ngữ
- Public UI locales: `vi`, `th`, `my`, `si`, `km`, `lo`, `en`, `zh`.
- Tier A: Việt, Thái, Myanmar, Sinhala, Khmer, Lào. Tier B: Anh, Trung.
- Pāli luôn là lớp canonical/source, không phải UI locale bắt buộc.
- Các locale cũ khác vẫn route-compatible nhưng bị ẩn khỏi selector, không prerender/QA và dùng `noindex`; có thể bật lại khi traffic thật chứng minh nhu cầu.
- Chỉ `vi` và `en` hiện có giá trị scripture/source đủ để đưa toàn bộ reader URLs vào sitemap/hreflang. Locale UI khác không được quảng bá như có bản dịch kinh bản địa khi chưa có nguồn.
- UI localization có thể được QA/cải thiện riêng; scripture translation tuyệt đối phải source-backed và không được AI tự lấp.

## 9. Responsive UX
Bắt buộc test ít nhất 4 lớp:
- Phone <= 640px
- Tablet/DeX 641–1024px
- Desktop 1025–1499px
- Wide >= 1500px
Mobile bottom dock không được che nội dung/nút quan trọng. Tên đầy đủ 5 bộ được phép wrap trên mobile.

## 10. Dữ liệu website + RAG/AI
- Nguồn chuẩn: `data/catalog/*.json`.
- Mỗi bài giữ ID ổn định, canonical ref, code quốc tế, viCode, title, Pāli, topics, source, translator/license, version.
- RAG export: `npm run rag:export`.
- Mỗi chunk có stable id + `content_hash` + `embedding_cache_key`.
- Quality gate kiểm tra số catalog/audio thực tế; không hard-code giả định số lượng cho SN/AN/KN trước khi khám phá canonical refs.

## 11. YouTube — nguyên tắc tích hợp
- Reader đã có khả năng render video theo `youtubeId` như nội dung bổ sung; YouTube không được biến homepage thành feed chính.
- Không sửa thủ công JSX từng trang. Dữ liệu video phải map theo canonicalRef/videoId trong catalog (ưu tiên tách `videos.json` khi triển khai lớn).
- Giai đoạn tự động hóa: YouTube Data API scan video của channel, đọc mã cấu trúc trong title/description như `TB 21`, `MN 21`, `TrB 1`, map vào canonicalRef; trường hợp mơ hồ cho manual override.
- Nên hỗ trợ `startSeconds/endSeconds`, title, role/topic để một video hoặc trích đoạn gắn đúng bài/đoạn.

## 12. Vercel / domain — URL CỐ ĐỊNH
- Không tạo project Vercel mới cho mỗi phiên bản.
- Project cố định: `nikaya-reader-v4-final`.
- Stable URL: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app`.
- Vercel Git Integration nối repo GitHub; production branch `main`; merge main tự deploy cùng project/URL.
- URL random chỉ là deployment nội bộ, không đưa làm URL chính.
- Nếu production cần public cho người ngoài, `Require Log In` của Deployment Protection phải tắt; kiểm tra lại bằng tab ẩn danh.

## 13. Cách người dùng theo dõi công việc
- Dễ xem trên website: `https://nikaya-reader-v4-final-khoa-3f1b.vercel.app/vi/tien-do`.
- Nguồn kỹ thuật chính xác nhất: `https://github.com/nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya/actions`.
- Chỉ coi “đang làm” khi GitHub workflow/job là `queued` hoặc `in_progress`; automation ChatGPT bật một mình không phải bằng chứng công việc đang chạy.

## 14. Quy trình chuẩn khi tiếp tục
1. Đọc `PROJECT_STATE.md`, `AGENTS.md`, `README.md`, `data/README.md`.
2. Đọc `main` + GitHub Actions/release mới nhất; actual state thắng state file cũ.
3. Không tạo repo/project/Vercel URL mới nếu không có lý do đặc biệt.
4. **Data/catalog/toàn văn/PDF trước; audio chạy bất đồng bộ sau.**
5. Với mỗi collection: canonical discovery → provenance/rights → catalog + full text → generated PDF/reader/search → RAG export → build/smoke/responsive → main/Vercel.
6. Audio pipeline độc lập: chọn voice bằng sample nghe thực tế → normalization → render theo free quota → validate/hash/checkpoint → release → catalog mapping tự cập nhật.
7. Build + RAG + catalog validation + smoke-test reader. Audio completeness không được chặn việc publish corpus nếu UI xử lý trạng thái chưa có audio đúng cách.
8. Chỉ gọi **collection corpus hoàn tất** khi 100% canonical refs đã có catalog/toàn văn/PDF và reader production PASS. Chỉ gọi **audio hoàn tất** khi 100% audio final của collection PASS.
9. Chỉ merge vào `main` sau khi HEAD cuối cùng có quality gate xanh cho phần đang triển khai.
10. Vercel Git Integration tự deploy project cố định.
11. Xác nhận production bằng stable URL; không gửi random deployment URL.
12. Update file này khi kiến trúc/quy tắc/trạng thái một bộ thay đổi.

## 15. Thứ tự tiếp theo
- **Ngay bây giờ:** hoàn tất corpus Trường Bộ DN1–DN34 trên website (toàn văn + catalog + PDF + reader), không chờ audio.
- Sau đó: Tương Ưng Bộ SN/TƯB → Tăng Chi Bộ AN/TCB → Tiểu Bộ KN/TiB, luôn data-first.
- Song song dài hạn: thay audio Piper/checkpoint bằng cloud-quality audio miễn phí theo quota, có versioning và không render lại file final.
- Full-text segment search + highlight khi corpus hợp pháp được materialize đủ.
- Cloud sync cho bộ sưu tập đoạn kinh nếu sau này có tài khoản.
- YouTube importer/catalog theo canonicalRef.
- PDF mục lục/bookmarks/QR, PWA/offline, sau đó SEO/AdSense.
