import Image from "next/image";
import { useRouter } from "next/router";
import { useConfig } from "nextra-theme-docs";

let timestamps = {}
try {
  timestamps = require('./timestamps.json')
} catch {
  // file not generated yet (local dev without running build)
}

function LastUpdated() {
  const { filePath } = useConfig()
  const file = filePath?.split('/').pop()
  const raw = timestamps[file]
  if (!raw) return null
  const date = new Date(raw).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
  return <span>Last updated on {date}</span>
}

export default {
  logo: <span className="flex items-center gap-2">
    <Image src="/logo-removebg.png" alt="Logo" width={48} height={48} className="" />
    Omni Rest
  </span>,
  project: {
    link: "https://github.com/Abdulllah321/omni-rest",
  },
  docsRepositoryBase:
    "https://github.com/Abdulllah321/omni-rest/blob/master/docs-site",
  useNextSeoProps() {
    const { asPath } = useRouter();
    if (asPath !== "/") {
      return {
        titleTemplate: "%s – Omni Rest",
      };
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Omni Rest" />
      <meta
        property="og:description"
        content="Auto-generate REST APIs from your Prisma schema — zero config CRUD endpoints"
      />
      <meta property="og:image" content="https://omnirest-api.vercel.app/og-image.png" />
    </>
  ),
  banner: {
    key: "1.0-release",
    text: (
      <a href="https://github.com/Abdulllah321/omni-rest" target="_blank">
        🎉 Omni Rest v1.0 is now available! →
      </a>
    ),
  },
  footer: {
    text: "MIT 2025 © Abdulllah321.",
  },
  navigation: {
    prev: true,
    next: true,
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  editLink: {
    text: "Edit this page on GitHub →",
  },
  feedback: {
    content: "Question? Give us feedback →",
    labels: "feedback",
  },
  gitTimestamp: <LastUpdated />,
  toc: {
    backToTop: true,
    float: true,
  },
};
