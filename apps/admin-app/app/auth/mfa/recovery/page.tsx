import Image from "next/image";

export default function MfaRecoveryPage() {
  return <main className="grid min-h-screen place-items-center bg-background p-6">
    <section className="w-full max-w-lg rounded-2xl border bg-card p-7 shadow-xl">
      <Image src="/brand/yobalelma-mark.svg" alt="Yobalelma" width={56} height={56} priority />
      <p className="mt-6 text-xs font-black uppercase tracking-[.18em] text-primary">Récupération contrôlée</p>
      <h1 className="mt-2 text-3xl font-black">Récupérer l’accès MFA</h1>
      <p className="mt-3 text-sm text-muted-foreground">La réinitialisation MFA n’est jamais automatique. Contactez l’équipe Sécurité depuis le canal professionnel enregistré. Elle vérifiera votre identité, révoquera le facteur perdu dans Supabase, invalidera les sessions actives et vous fera reprendre l’enrôlement.</p>
      <ol className="mt-5 grid gap-3 text-sm">
        <li><strong>1.</strong> Communiquer l’e-mail professionnel et l’identifiant d’incident, jamais un mot de passe ou un code TOTP.</li>
        <li><strong>2.</strong> Réaliser la vérification d’identité hors bande avec deux agents autorisés.</li>
        <li><strong>3.</strong> Révoquer le facteur perdu et toutes les sessions après approbation tracée.</li>
        <li><strong>4.</strong> Se reconnecter et enrôler un nouveau facteur.</li>
      </ol>
      <form action="/api/auth/sign-out" className="mt-6" method="post"><button className="h-12 w-full rounded-xl bg-primary px-4 font-black text-primary-foreground" type="submit">Fermer les sessions et revenir à la connexion</button></form>
    </section>
  </main>;
}
