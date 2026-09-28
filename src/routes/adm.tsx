import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/adm")({
  head: () => ({
    meta: [
      { title: "agendo — Painel Super Admin SaaS" },
      {
        name: "description",
        content: "Painel Super Admin SaaS da plataforma agendo: financeiro, assinaturas, anúncios, afiliados e configurações.",
      },
    ],
  }),
  component: AdmPage,
});

function AdmPage() {
  return (
    <iframe
      src="/adm.html"
      title="agendo — Painel Super Admin"
      className="block h-screen w-screen border-0"
    />
  );
}
