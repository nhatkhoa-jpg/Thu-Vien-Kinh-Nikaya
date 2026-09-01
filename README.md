# 5 Đại Tạng Kinh Nikāya

Modern multilingual Next.js library for the Five Nikāya collections.

## Mã hiển thị tiếng Việt
- `TrB` — Trường Bộ
- `TB` — Trung Bộ
- `TƯB` — Tương Ưng Bộ
- `TCB` — Tăng Chi Bộ
- `TiB` — Tiểu Bộ

Mã quốc tế `DN / MN / SN / AN / KN` vẫn được giữ nhỏ bên cạnh và trong metadata để đối chiếu học thuật, tìm kiếm và liên thông dữ liệu.

## AI / RAG data layer
`data/catalog/*.json` là nguồn dữ liệu máy đọc được; UI chỉ là adapter. Mỗi bài có ID ổn định, mã Việt + mã quốc tế, provenance nguồn/quyền và `contentVersion`.

`npm run rag:export` sinh JSONL deterministic cho RAG và knowledge corpus. Mỗi RAG chunk có SHA-256 `content_hash` / `embedding_cache_key`, nên local pipeline có thể tái sử dụng embedding cũ và chỉ re-embed chunk thay đổi.

Xem [`data/README.md`](data/README.md).

### Generated exports
Sau khi chạy `npm run rag:export`:
- `data/exports/nikaya-rag.vi.jsonl`
- `data/exports/nikaya-rag.en.jsonl`
- `data/exports/nikaya-knowledge.vi.jsonl`
- `data/exports/nikaya-knowledge.en.jsonl`

JSONL giữ cấu trúc đơn giản để nạp vào LangChain/LlamaIndex hoặc loader tự viết, sau đó lưu vào Chroma, Qdrant, FAISS, Milvus, Weaviate, pgvector hay vector store local khác.

## UX
Responsive phone, tablet/DeX, desktop và wide-screen; reader font/dark-mode/progress; audio speed 0.75×–2×; YouTube chỉ hiện khi có video thật.

## Content rights
Source / translator / license metadata được giữ theo từng bài và truyền sang export AI.
