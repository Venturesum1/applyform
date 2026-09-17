"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SKILL_PROFICIENCY_LEVELS, SUGGESTED_SKILLS, type SkillProficiencyLevel } from "@/lib/key-skills";

export type SkillLevelMap = Record<string, SkillProficiencyLevel | "">;

interface KeySkillsPickerProps {
  value: SkillLevelMap;
  onChange: (skill: string, level: SkillProficiencyLevel | "") => void;
}

export function KeySkillsPicker({ value, onChange }: KeySkillsPickerProps) {
  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label>Key Skills</Label>
      <p className="text-xs text-muted-foreground">
        Rate your proficiency for any that apply. Leave the rest as &ldquo;Not applicable&rdquo;.
      </p>
      <div className="divide-y divide-border rounded-lg border border-input">
        {SUGGESTED_SKILLS.map((skill) => (
          <div key={skill} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-foreground">{skill}</span>
            <Select
              value={value[skill] || "none"}
              onValueChange={(next) => onChange(skill, next === "none" ? "" : (next as SkillProficiencyLevel))}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not applicable</SelectItem>
                {SKILL_PROFICIENCY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
