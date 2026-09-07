import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

const BASE_URL = "https://eclipsetransportla.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;
const SITE_NAME = "Eclipse Transport";

function setMeta(name: string, content: string, useProperty = false) {
  const attr = useProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(id: string, data: Record<string, unknown>) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function useSEO({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  noIndex = false,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Luxury Private Car Service in Los Angeles`;
    const resolvedDescription = description ?? "Premium luxury car service in Los Angeles. Airport transfers, corporate travel, weddings & events. Cadillac Escalade, Chevrolet Suburban, Lincoln Continental. Book online 24/7.";
    const resolvedOgTitle = ogTitle ?? fullTitle;
    const resolvedOgDescription = ogDescription ?? resolvedDescription;
    const resolvedImage = ogImage ?? DEFAULT_OG_IMAGE;
    const resolvedCanonical = canonical ?? BASE_URL;

    // Page title
    document.title = fullTitle;

    // Meta tags
    setMeta("description", resolvedDescription);
    if (keywords) setMeta("keywords", keywords);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");

    // Open Graph
    setMeta("og:type", ogType, true);
    setMeta("og:title", resolvedOgTitle, true);
    setMeta("og:description", resolvedOgDescription, true);
    setMeta("og:image", resolvedImage, true);
    setMeta("og:url", resolvedCanonical, true);
    setMeta("og:site_name", SITE_NAME, true);

    // Twitter
    setMeta("twitter:title", resolvedOgTitle);
    setMeta("twitter:description", resolvedOgDescription);
    setMeta("twitter:image", resolvedImage);
    setMeta("twitter:url", resolvedCanonical);

    // Canonical link
    setLink("canonical", resolvedCanonical);

    // JSON-LD LocalBusiness — helps Google show rich results, map pack and “Book” actions
    setJsonLd("ld-localbusiness", {
      "@context": "https://schema.org",
      "@type": "LimousineService",
      name: SITE_NAME,
      url: BASE_URL,
      image: `${BASE_URL}/og-image.jpg`,
      telephone: "+1-626-977-4721",
      email: "Eclipsetransport995@gmail.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Los Angeles",
        addressRegion: "CA",
        addressCountry: "US",
      },
      areaServed: {
        "@type": "City",
        name: "Los Angeles",
      },
      priceRange: "$$",
      description: resolvedDescription,
    });

    // JSON-LD WebSite with Sitelinks SearchBox
    setJsonLd("ld-website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: BASE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${BASE_URL}/services?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });
  }, [title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogType, noIndex]);
}
