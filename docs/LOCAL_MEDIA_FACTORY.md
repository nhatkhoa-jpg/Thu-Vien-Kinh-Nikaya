# Local Media Factory — MI50 / offline TTS

Mục tiêu: dùng máy local để render audio hàng loạt, còn repository chỉ chuẩn hóa kinh văn, checkpoint, manifest, PDF, checksum và đóng gói.

## Nguyên tắc quan trọng

- TTS nhận **chỉ kinh văn** từ `record.segments[].text`.
- Không đưa nguồn, dịch giả, license, provenance, summary, practice note, UI text hoặc debug text vào TTS.
- Render **từng bài kinh** trước. File đã có được giữ làm checkpoint; chạy lại sẽ skip.
- Chỉ ghép thành MP3 cả bộ sau khi từng bài đã render xong.
- Cùng một collection có thể đồng thời phát hành: từng bài MP3, các phần 30–90 phút, và một MP3 cả bộ nếu kích thước hợp lý.

## 1. Chuẩn bị pack

```powershell
npm ci
npm run media:export -- --collection DN --out dist/local-media
```

Kết quả:

- `dist/local-media/dn/tts/*.txt`: mỗi bài một file, body-only.
- `dn.body-only.txt`: toàn bộ kinh văn có sẵn theo thứ tự catalog.
- `manifest.json`: canonical ref, title, character count, SHA-256 và tên file output.
- `concat.ffconcat`: thứ tự ghép MP3.
- `mp3/`: nơi local TTS ghi kết quả.

Thay `DN` bằng `MN`, `SN`, `AN`, `KN` khi corpus tương ứng đã materialize.

## 2. Render bằng TTS local

Wrapper không khóa vào một engine cụ thể. Truyền command template hiện đang dùng trên máy MI50, với hai placeholder bắt buộc:

- `{input}` = đường dẫn TXT body-only.
- `{output}` = đường dẫn MP3 cần tạo.

Ví dụ:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-media-factory.ps1 `
  -Collection DN `
  -TtsCommand 'python local_tts.py --input {input} --output {output}'
```

Nếu engine chịu được nhiều job GPU đồng thời:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-media-factory.ps1 `
  -Collection DN `
  -Workers 2 `
  -TtsCommand 'python local_tts.py --input {input} --output {output}'
```

Khuyến nghị bắt đầu `Workers=1`, đo VRAM/tốc độ rồi mới tăng. MI50 16 GB không nên bị ép nhiều process nếu model chiếm phần lớn VRAM.

## 3. Checkpoint / resume

Nếu máy tắt hoặc job lỗi, chạy lại **y nguyên command**. Wrapper skip MP3 đã tồn tại và chỉ làm phần thiếu.

Không dùng `-Force` trừ khi muốn render lại tất cả.

## 4. MP3 cả bộ

Khi tất cả file bài kinh đã có, wrapper tự chạy:

```bash
ffmpeg -f concat -safe 0 -i concat.ffconcat -c copy dn-complete.mp3
```

`-c copy` gần như tức thời và không làm giảm chất lượng, với điều kiện mọi MP3 có cùng codec/sample-rate/channels.

Nếu backend TTS xuất thông số không đồng nhất, chuẩn hóa trước về một profile cố định, ví dụ MP3 mono 48–64 kbps, 24 kHz hoặc 44.1 kHz.

## 5. PDF cả bộ

```powershell
npx playwright install chromium
npm run media:pdf -- --collection DN --pack dist/local-media
```

Kết quả: `dist/local-media/dn/dn-complete.pdf`.

PDF có bìa, mục lục, tên từng bài và kinh văn. Dữ liệu kỹ thuật không bị trộn vào thân bài. Thông tin provenance chỉ được ghi ở phần thông tin bản số hóa.

## 6. Phát hành

Sau khi kiểm tra nghe/đọc:

1. Từng bài MP3: dùng player web và tải riêng.
2. MP3 cả bộ: nút `Tải trọn bộ để nghe offline`.
3. PDF cả bộ: nút `Tải PDF trọn bộ`.
4. R2: media primary cho website.
5. Internet Archive: preservation mirror khi account được cấu hình.
6. Manifest + SHA-256: giữ trên GitHub và R2 để xác minh.

## 7. Không làm một file audio khổng lồ ngay từ text

Một file 20–60 giờ render thẳng có rủi ro mất toàn bộ checkpoint nếu crash. Kiến trúc chuẩn là:

`canonical corpus -> body-only TXT từng bài -> local TTS từng bài -> verify -> concat -> whole-collection MP3`

Cách này cũng cho phép đổi giọng hoặc sửa riêng một bài mà không render lại cả bộ.
