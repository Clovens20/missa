'use client'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'

export default function PolitiqueCookies() {
  return (
    <>
      <Header />
      <div className="bg-white min-h-screen">
        <div style={{ fontFamily: "'Georgia', serif", maxWidth: 860, margin: "0 auto", padding: "60px 24px", color: "#1a1a1a", lineHeight: 1.8 }}>
          <div style={{ borderBottom: "3px solid #c9a96e", paddingBottom: 32, marginBottom: 48 }}>
            <p style={{ fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "#c9a96e", marginBottom: 12 }}>Missa Shop</p>
            <h1 style={{ fontSize: 38, fontWeight: 300, letterSpacing: 1, margin: 0 }}>Politique des Cookies</h1>
            <p style={{ color: "#888", fontSize: 14, marginTop: 12 }}>Dernière mise à jour : 16 mai 2026</p>
          </div>

          <Section title="1. Qu'est-ce qu'un cookie ?">
            Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette, smartphone) lorsque vous visitez un site web. Les cookies permettent au site de reconnaître votre appareil lors de visites ultérieures et de mémoriser certaines informations vous concernant.
          </Section>

          <Section title="2. Les cookies que nous utilisons">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 16 }}>
              <thead>
                <tr style={{ background: "#f5ede0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "2px solid #c9a96e" }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "2px solid #c9a96e" }}>Finalité</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "2px solid #c9a96e" }}>Obligatoire</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Essentiels", "Panier d'achat, session, authentification, sécurité", "Oui"],
                  ["Analytiques", "Statistiques de visite, comportement utilisateur (Google Analytics)", "Non"],
                  ["Marketing", "Publicités ciblées, retargeting (Meta Pixel, Google Ads)", "Non"],
                  ["Fonctionnels", "Préférences langue, devise, liste de souhaits", "Non"],
                ].map(([type, purpose, required], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #eee", fontWeight: 600 }}>{type}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #eee" }}>{purpose}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #eee", color: required === "Oui" ? "#2d7a2d" : "#888" }}>{required}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="3. Cookies tiers">
            Nous utilisons des services tiers qui peuvent déposer leurs propres cookies :
            <ul>
              <li><strong>Google Analytics :</strong> analyse du trafic et du comportement des visiteurs</li>
              <li><strong>Meta (Facebook) Pixel :</strong> mesure des conversions et publicités ciblées</li>
              <li><strong>Google Ads :</strong> suivi des conversions publicitaires</li>
              <li><strong>Stripe / PayPal :</strong> traitement sécurisé des paiements</li>
            </ul>
            Ces tiers ont leurs propres politiques de confidentialité que nous vous encourageons à consulter.
          </Section>

          <Section title="4. Gestion des cookies">
            Vous pouvez contrôler et gérer les cookies de plusieurs façons :<br /><br />
            <strong>Via votre navigateur :</strong> la plupart des navigateurs vous permettent de refuser ou de supprimer les cookies dans leurs paramètres. Voici les liens vers les instructions des principaux navigateurs :
            <ul>
              <li>Chrome : Paramètres → Confidentialité et sécurité → Cookies</li>
              <li>Firefox : Options → Vie privée et sécurité → Cookies</li>
              <li>Safari : Préférences → Confidentialité → Cookies</li>
              <li>Edge : Paramètres → Cookies et autorisations du site</li>
            </ul>
            <strong>Attention :</strong> Désactiver certains cookies essentiels peut affecter le fonctionnement de notre boutique (panier, connexion, paiement).
          </Section>

          <Section title="5. Durée de conservation des cookies">
            <ul>
              <li><strong>Cookies de session :</strong> supprimés à la fermeture du navigateur</li>
              <li><strong>Cookies persistants :</strong> conservés entre 30 jours et 2 ans selon leur nature</li>
              <li><strong>Cookies analytiques :</strong> 13 mois maximum (Google Analytics)</li>
              <li><strong>Cookies marketing :</strong> 90 jours en moyenne</li>
            </ul>
          </Section>

          <Section title="6. Modifications">
            Nous nous réservons le droit de modifier cette politique de cookies à tout moment. Toute modification sera publiée sur cette page avec une date de mise à jour. Votre utilisation continue du site après modification vaut acceptation de la nouvelle politique.
          </Section>

          <Section title="7. Contact">
            Pour toute question relative aux cookies :<br /><br />
            <strong>Missa Shop</strong><br />
            Email : <strong>privacy@www.missashopp.com</strong>
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
