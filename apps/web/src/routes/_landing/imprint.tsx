import { Callout, H2, H4, Intent } from "@blueprintjs/core";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "../../components/layout/PageLayout.tsx";

export const Route = createFileRoute("/_landing/imprint")({
  component: ImprintPage,
});

function ImprintPage() {
  return (
    <PageLayout>
      <div style={{ padding: "4rem 2rem", maxWidth: 640, margin: "0 auto" }}>
        <H2>Imprint</H2>

        <H4>Project</H4>
        <p>
          BasaltUI Playground is an open-source frontend boilerplate and proof-of-concept
          application exploring TanStack Start, Blueprint v6, and modern TypeScript full-stack
          patterns.
        </p>

        <H4>Data Sources</H4>
        <ul style={{ lineHeight: 2 }}>
          <li>
            <a href="https://colintalkscrypto.com/cbbi" target="_blank" rel="noopener noreferrer">
              CBBI — Colin Talks Crypto Bitcoin Bull Run Index
            </a>
          </li>
          <li>
            <a href="https://github.com/Zaczero/CBBI" target="_blank" rel="noopener noreferrer">
              CBBI algorithm (Zaczero)
            </a>
          </li>
          <li>
            <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer">
              CoinGecko — Bitcoin price data
            </a>
          </li>
          <li>
            <a
              href="https://alternative.me/crypto/fear-and-greed-index/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Alternative.me — Fear & Greed Index
            </a>
          </li>
        </ul>

        <H4>Technology Stack</H4>
        <ul style={{ lineHeight: 2 }}>
          <li>TanStack Start — SSR framework</li>
          <li>TanStack Router + Query — routing and data fetching</li>
          <li>Blueprint v6 — UI component library</li>
          <li>Elysia + Bun — backend API framework and runtime</li>
          <li>Drizzle ORM + PostgreSQL — database layer</li>
          <li>BetterAuth — authentication</li>
          <li>Recharts — data visualisation</li>
        </ul>

        <Callout intent={Intent.WARNING} title="Disclaimer" style={{ marginTop: 24 }}>
          The information displayed on this site is for educational and informational purposes only.
          It does not constitute financial advice. Cryptocurrency investments carry significant
          risk. Past performance is not indicative of future results.
        </Callout>
      </div>
    </PageLayout>
  );
}
