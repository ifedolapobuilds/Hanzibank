import { pgTable, text, integer, timestamp, uuid, uniqueIndex, pgSchema } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const authSchema = pgSchema("auth");
const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const words = pgTable(
  "words",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    english: text("english").notNull(),
    pinyin: text("pinyin").notNull(),
    character: text("character").notNull(),
    characterCount: integer("character_count").notNull(),
    category: text("category").notNull().default("miscellaneous"),
    tags: text("tags").array().notNull().default([]),
    notes: text("notes"),
    dateAdded: timestamp("date_added", { withTimezone: true }).defaultNow().notNull(),
    dateModified: timestamp("date_modified", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userEnglishIdx: uniqueIndex("user_english_idx").on(table.userId, table.english),
  })
);

export const wordStats = pgTable("word_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  wordId: uuid("word_id")
    .notNull()
    .references(() => words.id, { onDelete: "cascade" })
    .unique(),
  timesReviewed: integer("times_reviewed").default(0).notNull(),
  timesCorrect: integer("times_correct").default(0).notNull(),
  timesIncorrect: integer("times_incorrect").default(0).notNull(),
  lastPracticed: timestamp("last_practiced", { withTimezone: true }),
});

export const wordsRelations = relations(words, ({ one }) => ({
  stats: one(wordStats, {
    fields: [words.id],
    references: [wordStats.wordId],
  }),
}));

export const wordStatsRelations = relations(wordStats, ({ one }) => ({
  word: one(words, {
    fields: [wordStats.wordId],
    references: [words.id],
  }),
}));

export type Word = typeof words.$inferSelect;
export type NewWord = typeof words.$inferInsert;
export type WordStat = typeof wordStats.$inferSelect;
export type NewWordStat = typeof wordStats.$inferInsert;
