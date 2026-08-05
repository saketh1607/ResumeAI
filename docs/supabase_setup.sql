-- Run in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- Gemini models/embedding-001 uses 768 dimensions

create extension if not exists vector;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  content text,
  metadata jsonb,
  embedding vector(768)
);

create index if not exists documents_metadata_idx on documents using gin (metadata);

create or replace function match_documents (
  query_embedding vector(768),
  filter jsonb default '{}'
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding;
end;
$$;
