import { z } from "zod";

const reviewBaseSchema = z.object({
  targetType: z.enum(["doctor", "partner"]),
  targetId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().min(1).max(2000),
});

type ReviewBaseInput = z.infer<typeof reviewBaseSchema>;

function refineReviewTargetId(data: ReviewBaseInput, ctx: z.RefinementCtx) {
  if (data.targetType === "doctor") {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(data.targetId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid doctor id",
        path: ["targetId"],
      });
    }
  }
}

export const submitReviewSchema =
  reviewBaseSchema.superRefine(refineReviewTargetId);

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

/** @deprecated Use submitReviewSchema — patientId must not come from the client. */
export const reviewSchema = reviewBaseSchema
  .extend({
    patientId: z.string().uuid().optional(),
  })
  .superRefine(refineReviewTargetId);

export type ReviewInput = z.infer<typeof reviewSchema>;
