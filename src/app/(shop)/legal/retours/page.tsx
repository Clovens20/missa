'use client'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'

export default function PolitiqueRetour() {
  return (
    <>
      <Header />
      <div className="bg-white min-h-screen">
        <div style={{ fontFamily: "'Georgia', serif", maxWidth: 860, margin: "0 auto", padding: "60px 24px", color: "#1a1a1a", lineHeight: 1.8 }}>
          <div style={{ borderBottom: "3px solid #c9a96e", paddingBottom: 32, marginBottom: 48 }}>
            <p style={{ fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "#c9a96e", marginBottom: 12 }}>Missa Shop</p>
            <h1 style={{ fontSize: 38, fontWeight: 300, letterSpacing: 1, margin: 0 }}>Politique de Retour & Remboursement</h1>
            <p style={{ color: "#888", fontSize: 14, marginTop: 12 }}>Dernière mise à jour : 16 mai 2026</p>
          </div>

          <div style={{ background: "#fdf8f2", border: "1px solid #e8d5b0", borderRadius: 8, padding: "20px 24px", marginBottom: 48, fontSize: 15 }}>
            📦 <strong>Notre engagement :</strong> Votre satisfaction est notre priorité. Si vous n'êtes pas entièrement satisfait(e) de votre achat, nous acceptons les retours dans un délai de <strong>30 jours</strong> suivant la réception de votre commande.
          </div>

          <Section title="1. Conditions d'éligibilité au retour">
            Pour être éligible à un retour, votre article doit respecter toutes les conditions suivantes :
            <ul>
              <li>✅ Retourné dans les <strong>30 jours</strong> suivant la date de réception</li>
              <li>✅ Dans son état d'origine — non porté, non lavé, non altéré</li>
              <li>✅ Avec toutes les étiquettes et étiquettes d'origine encore attachées</li>
              <li>✅ Dans son emballage d'origine ou un emballage équivalent</li>
              <li>✅ Accompagné du numéro de commande</li>
            </ul>
          </Section>

          <Section title="2. Articles non retournables">
            Les articles suivants <strong>ne peuvent pas être retournés</strong> pour des raisons d'hygiène et de sécurité :
            <ul>
              <li>❌ Sous-vêtements, lingerie, maillots de bain</li>
              <li>❌ Produits de beauté et cosmétiques ouverts</li>
              <li>❌ Articles personnalisés ou sur-mesure</li>
              <li>❌ Articles en solde ou en promotion finale marqués « Vente finale »</li>
              <li>❌ Articles endommagés par une mauvaise utilisation du client</li>
              <li>❌ Bijoux piercing</li>
            </ul>
          </Section>

          <Section title="3. Procédure de retour">
            <strong>Étape 1 — Contactez-nous</strong><br />
            Envoyez un courriel à <strong>retours@missashop.com</strong> avec :
            <ul>
              <li>Votre numéro de commande (ex : #MS-XXXXX)</li>
              <li>Le ou les article(s) que vous souhaitez retourner</li>
              <li>La raison du retour</li>
              <li>Des photos de l'article si celui-ci est défectueux ou endommagé</li>
            </ul>
            <strong>Étape 2 — Approbation</strong><br />
            Notre équipe vous répondra sous 1 à 2 jours ouvrables avec les instructions de retour et l'adresse d'envoi.<br /><br />
            <strong>Étape 3 — Expédition</strong><br />
            Emballez soigneusement votre article et expédiez-le à l'adresse fournie. Nous vous recommandons d'utiliser un service avec numéro de suivi. Les frais de retour sont à la charge du client, sauf si l'article reçu est défectueux ou ne correspond pas à la description.
          </Section>

          <Section title="4. Remboursements">
            Une fois votre retour reçu et inspecté, nous vous informerons par courriel de l'approbation ou du refus de votre remboursement.<br /><br />
            <strong>Si approuvé :</strong>
            <ul>
              <li>Le remboursement sera effectué sur votre mode de paiement original</li>
              <li>Délai de traitement : <strong>5 à 10 jours ouvrables</strong> selon votre institution financière</li>
              <li>Les frais de livraison originaux ne sont pas remboursables (sauf en cas d'erreur de notre part)</li>
            </ul>
            <strong>Formes de remboursement disponibles :</strong>
            <ul>
              <li>Remboursement complet sur le mode de paiement original</li>
              <li>Crédit en boutique (valable 1 an)</li>
              <li>Échange contre un autre article de valeur égale ou supérieure</li>
            </ul>
          </Section>

          <Section title="5. Articles défectueux ou erronés">
            Si vous avez reçu un article défectueux, endommagé lors du transport, ou ne correspondant pas à votre commande, contactez-nous immédiatement à <strong>support@missashop.com</strong> avec des photos de l'article et de l'emballage.<br /><br />
            Dans ce cas :
            <ul>
              <li>Nous prenons en charge les frais de retour</li>
              <li>Vous recevrez un remplacement ou un remboursement complet à votre choix</li>
              <li>Aucun délai de 30 jours ne s'applique pour les articles défectueux signalés dans les 72 heures suivant la réception</li>
            </ul>
          </Section>

          <Section title="6. Échanges">
            Nous acceptons les échanges de taille ou de couleur dans les 30 jours suivant la réception, sous réserve de disponibilité des stocks. Pour initier un échange, suivez la même procédure que pour un retour en précisant l'article souhaité en remplacement.
          </Section>

          <Section title="7. Commandes non livrées ou perdues">
            Si votre colis n'est pas arrivé après le délai estimé, contactez-nous à <strong>support@missashop.com</strong> avec votre numéro de commande. Nous ouvrirons une enquête auprès du transporteur. Si le colis est déclaré perdu, nous vous proposerons un réenvoi gratuit ou un remboursement complet.
          </Section>

          <Section title="8. Contact">
            Pour toute question concernant votre retour ou remboursement :<br /><br />
            <strong>Missa Shop — Service Retours</strong><br />
            Email : <strong>retours@missashop.com</strong><br />
            Réponse sous 24-48h ouvrables
          </Section>
        </div>
      </div>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: 0.5, borderLeft: "3px solid #c9a96e", paddingLeft: 16, marginBottom: 16 }}>{title}</h2>
      <div style={{ paddingLeft: 16, fontSize: 15, color: "#333" }}>{children}</div>
    </div>
  );
}
