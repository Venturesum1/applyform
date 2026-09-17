export const SUGGESTED_SKILLS = [
  "Strong Python programming",
  "Strong hands-on experience with PyTorch",
  "Solid ML & Deep Learning fundamentals",
  "Strong Computer Vision & OpenCV experience",
  "Image processing, segmentation, object detection",
  "Human pose estimation / human parsing",
  "ML dataset preparation, cleaning & annotation",
  "Model training, fine-tuning and evaluation",
  "Generative AI / Diffusion Models",
  "Practical GPU / CUDA experience",
] as const;

export type SuggestedSkill = (typeof SUGGESTED_SKILLS)[number];

export const SKILL_PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;

export type SkillProficiencyLevel = (typeof SKILL_PROFICIENCY_LEVELS)[number];

export interface KeySkillEntry {
  skill: string;
  level: SkillProficiencyLevel;
}
