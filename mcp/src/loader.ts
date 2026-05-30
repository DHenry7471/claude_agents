import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";

export interface AgentDef {
  slug: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
}

export interface SkillDef {
  slug: string;
  name: string;
  description: string;
  systemPrompt: string;
}

/**
 * Strips the YAML frontmatter block and returns only the body text.
 * gray-matter already does this, but we re-export for clarity.
 */
function body(parsed: matter.GrayMatterFile<string>): string {
  return parsed.content.trim();
}

export function loadAgents(agentsDir: string): AgentDef[] {
  const files = readdirSync(agentsDir).filter((f) => f.endsWith(".md"));

  return files.map((file) => {
    const raw = readFileSync(join(agentsDir, file), "utf-8");
    const parsed = matter(raw);
    const fm = parsed.data as {
      name?: string;
      description?: string;
      model?: string;
    };

    const slug = basename(file, ".md");
    const name = fm.name ?? slug;
    const description =
      typeof fm.description === "string"
        ? fm.description.trim()
        : String(fm.description ?? "").trim();
    const model =
      fm.model && fm.model !== "inherit" ? fm.model : "claude-sonnet-4-6";

    return { slug, name, description, model, systemPrompt: body(parsed) };
  });
}

export function loadSkills(skillsDir: string): SkillDef[] {
  const skills: SkillDef[] = [];

  // skills/testing/<skill-name>/SKILL.md
  for (const category of readdirSync(skillsDir)) {
    const categoryPath = join(skillsDir, category);
    if (!statSync(categoryPath).isDirectory()) continue;

    for (const skillName of readdirSync(categoryPath)) {
      // Skip .skill zip archives
      if (skillName.endsWith(".skill")) continue;

      const skillPath = join(categoryPath, skillName);
      if (!statSync(skillPath).isDirectory()) continue;

      const skillMd = join(skillPath, "SKILL.md");
      let raw: string;
      try {
        raw = readFileSync(skillMd, "utf-8");
      } catch {
        continue; // no SKILL.md — skip
      }

      const parsed = matter(raw);
      const fm = parsed.data as { name?: string; description?: string };

      const slug = `skill-${category}-${skillName}`;
      const name = fm.name ?? skillName;
      const description =
        typeof fm.description === "string"
          ? fm.description.trim()
          : String(fm.description ?? "").trim();

      skills.push({ slug, name, description, systemPrompt: body(parsed) });
    }
  }

  return skills;
}
