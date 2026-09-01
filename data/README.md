# Nikāya AI / RAG data layer

Thư mục này là **nguồn dữ liệu máy đọc được**, tách khỏi UI. Mục tiêu là một lần chuẩn hóa nội dung rồi tái sử dụng cho website, RAG, vector database, local LLM và các pipeline huấn luyện sau này.

## Quy tắc cốt lõi

- `data/catalog/suttas.json` là nguồn chuẩn cho metadata bài kinh.
- Mỗi bài có `id` và `canonicalRef` ổn định. Không đổi ID chỉ vì đổi tiêu đề hoặc giao diện.
- `code` giữ mã quốc tế/Pāli (`MN 21`), `viCode` giữ mã dễ đọc cho người Việt (`TB 21`).
- `contentVersion` chỉ tăng khi nội dung ngữ nghĩa thay đổi.
- Mỗi chunk export có `content_hash` và `embedding_cache_key`. Pipeline embedding chỉ cần tạo lại vector khi hash thay đổi.
- Metadata nguồn, người dịch và license đi cùng từng document/chunk để RAG luôn có provenance và có thể trích nguồn.
- Không lưu vector embedding vào catalog. Vector phụ thuộc model embedding và nên nằm trong vector DB/cache riêng.

## Export sẵn

- `exports/nikaya-rag.vi.jsonl`: mỗi dòng là một chunk tiếng Việt, phù hợp ingest vào LangChain, LlamaIndex, Chroma, Qdrant, FAISS, Milvus, Weaviate, OpenWebUI hoặc pipeline tự viết.
- `exports/nikaya-rag.en.jsonl`: tương tự cho tiếng Anh.
- `exports/nikaya-knowledge.vi.jsonl`: một document/bài, tiện làm knowledge corpus, document store hoặc continued-pretraining corpus.
- `exports/nikaya-knowledge.en.jsonl`: bản tiếng Anh.

Chạy lại export:

```bash
npm run rag:export
```

## Khi nhập toàn văn sau này

Không cắt theo số ký tự ngẫu nhiên. Ưu tiên đoạn/section có ID ổn định từ nguồn. Mỗi đoạn nên lưu:

`segment_id`, `section_path`, `language`, `text`, `source_ref`, `content_hash`.

Sau đó exporter có thể gộp 1–n segment thành chunk theo token budget. Vì segment ID và hash ổn định, chỉ những đoạn thay đổi mới phải re-embed.

## RAG và training

- Muốn trả lời chính xác, trích dẫn được: dùng RAG từ `nikaya-rag.*.jsonl`.
- Muốn model quen văn phong/thuật ngữ: có thể dùng `nikaya-knowledge.*.jsonl` cho continued pretraining hoặc xây dataset riêng.
- Không nên fine-tune raw kinh thành cặp hỏi/đáp tự sinh rồi coi đó là nguồn chân lý; điều đó dễ làm mất provenance và tăng hallucination.
