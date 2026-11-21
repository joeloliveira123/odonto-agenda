import { describe, expect, it } from "vitest";
import {
  DEFAULT_DEMO_FAQS,
  DEFAULT_DEMO_STAFF,
  DEFAULT_DEMO_TREATMENTS
} from "@/features/clinics/demoSeed";
import { DEFAULT_DEMO_ARTICLES } from "@/features/content/demoArticles";
import {
  getPublishedTreatmentDetail,
  isArticlePublishable
} from "@/lib/content/publication";

describe("Phase 2 educational content publication rules", () => {
  it("all default demo articles are published with reviewer attribution", () => {
    expect(DEFAULT_DEMO_ARTICLES.length).toBe(DEFAULT_DEMO_TREATMENTS.length);
    for (const article of DEFAULT_DEMO_ARTICLES) {
      expect(isArticlePublishable(article)).toBe(true);
    }
  });

  it("blocks draft or unreviewed articles from public detail view", () => {
    const draftOnly = DEFAULT_DEMO_ARTICLES.map((a) =>
      a.treatmentId === "tr-1" ? { ...a, publicationStatus: "draft" as const } : a
    );
    const detail = getPublishedTreatmentDetail(
      "avaliacao-limpeza",
      DEFAULT_DEMO_TREATMENTS,
      draftOnly,
      DEFAULT_DEMO_STAFF,
      DEFAULT_DEMO_FAQS
    );
    expect(detail?.treatment.id).toBe("tr-1");
    expect(detail?.article).toBeNull();
  });

  it("resolves every treatment slug with reviewer and FAQs", () => {
    for (const t of DEFAULT_DEMO_TREATMENTS) {
      const detail = getPublishedTreatmentDetail(
        t.slug,
        DEFAULT_DEMO_TREATMENTS,
        DEFAULT_DEMO_ARTICLES,
        DEFAULT_DEMO_STAFF,
        DEFAULT_DEMO_FAQS
      );
      expect(detail).not.toBeNull();
      expect(detail?.article).not.toBeNull();
      expect(detail?.reviewer).not.toBeNull();
    }
  });
});
