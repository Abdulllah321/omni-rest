import Image from "next/image";
import { useRouter } from "next/router";
import { useConfig } from "nextra-theme-docs";

export default {
  logo: <span className="flex items-center gap-2">
    <Image src="/logo-removebg.png" alt="Logo" width={48} height={48} className="" />
    Omni Rest
  </span>,
  project: {
    link: "https://github.com/Abdulllah321/omni-rest",
  },
  docsRepositoryBase:
    "https://github.com/Abdulllah321/omni-rest/blob/main/docs-site",
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
      <meta property="og:image" content="https://omnirest.dev/og-image.png" />
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
  gitTimestamp: "Last updated on",
  toc: {
    backToTop: true,
    float: true,
  },
};
