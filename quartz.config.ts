import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "cbarkr",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
    baseUrl: "blog.cbarkr.com",
    ignorePatterns: ["private", "templates", ".obsidian", "!(media)**/!(*.md)", "!(*.md)"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "local",
      cdnCaching: false,
      typography: {
        header: "Geist",
        body: "Geist",
        code: "Geist",
      },
      colors: {
        lightMode: {
          light: "#f8f8f8",
          lightgray: "#f8f8f8",
          gray: "#b8b8b8",
          darkgray: "#111111",
          dark: "#111111",
          secondary: "#284b63",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
        },
        darkMode: {
          light: "#111111",
          lightgray: "#111111",
          gray: "#646464",
          darkgray: "#f8f8f8",
          dark: "#f8f8f8",
          secondary: "#7b97aa",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
