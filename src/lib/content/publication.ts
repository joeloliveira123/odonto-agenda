import type { FAQ, StaffMember, Treatment, TreatmentArticle } from "@/types/domain";

export function isArticlePublishable(article: TreatmentArticle): boolean {
  return (
    article.publicationStatus === "published" &&
    Boolean(article.reviewerStaffId) &&
    Boolean(article.reviewedAt)
  );
}

export function getPublishedTreatmentDetail(
  slug: string,
  treatments: Treatment[],
  articles: TreatmentArticle[],
  staff: StaffMember[],
  faqs: FAQ[]
) {
  const treatment = treatments.find((t) => t.slug === slug && t.active) ?? null;
  if (!treatment) return null;

  const article =
    articles.find((a) => a.treatmentId === treatment.id && isArticlePublishable(a)) ??
    null;

  const reviewer = article?.reviewerStaffId
    ? staff.find((s) => s.id === article.reviewerStaffId) ?? null
    : null;

  const relatedFaqs = faqs.filter(
    (f) =>
      f.publicationStatus === "published" &&
      (f.relatedTreatmentIds.includes(treatment.id) || f.relatedTreatmentIds.length === 0)
  );

  return {
    treatment,
    article,
    reviewer,
    relatedFaqs
  };
}
