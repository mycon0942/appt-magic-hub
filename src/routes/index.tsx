import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "agendo — Painel de agendamentos" },
      {
        name: "description",
        content:
          "Painel agendo: agenda, serviços, fichas de anamnese, promoções e pagamentos em um só lugar.",
      },
      { property: "og:title", content: "agendo — Painel de agendamentos" },
      {
        property: "og:description",
        content:
          "Gerencie agenda, clientes, cupons e pagamentos do seu estúdio pelo painel agendo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/agenda.html"
      title="agendo — Painel"
      className="h-screen w-screen border-0"
      style={{ display: "block" }}
    />
  );
}
