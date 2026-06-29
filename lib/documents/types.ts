import { z } from "zod";

/**
 * BlockNote 기본 스키마의 block 배열. MVP 에서는 구조 전체를 엄격 검증하지 않고
 * "객체 배열" 수준만 보장한다(엄격 블록 검증은 후속 슬라이스). content 의 진실은 에디터.
 */
export const BlocksSchema = z.array(z.record(z.string(), z.unknown()));
export type Blocks = z.infer<typeof BlocksSchema>;

export type DocumentRecord = {
  id: string;
  ownerId: string;
  project: string;
  title: string;
  slug: string;
  content: Blocks;
  createdAt: string;
  updatedAt: string;
};
