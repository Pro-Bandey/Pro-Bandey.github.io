export interface Repository {
  Repo: string;
  Owner?: string;
  Status: string;
  Date: string;
  UpdatedAt?: string;
  Banner?: string;
  Langs?: Record<string, number>;
  LangBytes?: Record<string, number>;
  Desc: string;
  ReadMeIs: boolean;
  PreviewUrl?: string;
  Stars?: number;
  Forks?: number;
  Commits?: number;
  Archived?: boolean;
}

export interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
}

export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Python: "#3572A5",
  Shell: "#89e051",
  C: "#555555",
  "C++": "#f34b7d",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  YAML: "#cb171e",
  Markdown: "#083fa1",
  Vue: "#41b883",
  React: "#61DAFB",
  Svelte: "#ff3e00",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Dart: "#0175C2",
  Zig: "#F7A41D",
  SQL: "#336791",
  Dockerfile: "#384d54",
  Csharp: "#178600",
  Perl: "#0298c3",
  Scala: "#DC322F",
  Haskell: "#5e5086",
  Lua: "#000080",
};
