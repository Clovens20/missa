'use client'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'

export default function PolitiqueExpedition() {
  return (
    <>
      <Header />
      <div className="bg-white min-h-screen">
        <div style={{ fontFamily: "'Georgia', serif", maxWidth: 860, margin: "0 auto", padding: "60px 24px", color: "#1a1a1a", lineHeight: 1.8 }}>
          <div style={{ borderBottom: "3px solid #c9a96e", paddingBottom: 32, marginBottom: 48 }}>
            <p style={{ fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "#c9a96e", marginBottom: 12 }}>Missa Shop</p>
            <h1 style={{ fontSize: 38, fontWeight: 300, letterSpacing: 1, margin: 0 }}>Politique d'Expédition</h1>
            <p style={{ color: "#888", fontSize: 14, marginTop: 12 }}>Dernière mise à jour : 16 mai 2026</p>
          </div>

          <div style={{ background: "#fdf8f2", border: "1px solid #e8d5b0", borderRadius: 8, padding: "20px 24px", marginBottom: 48, fontSize: 15 }}>
            🚚 <strong>Livraison gratuite</strong> sur toutes les commandes de <strong>50$ CAD et plus</strong>. Nous livrons dans le monde entier !
          </div>

          <Section title="1. Traitement des commandes">
            Toutes les commandes sont traitées dans un délai de <strong>1 à 3 jours ouvrables</strong> après confirmation du paiement. Les commandes passées le week-end ou les jours fériés seront traitées le prochain jour ouvrable.<br /><br />
            Vous recevrez un courriel de confirmation avec un numéro de suivi dès que votre commande sera expédiée.
          </Section>

          <Section title="2. Délais et frais de livraison">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 16 }}>
              <thead>
                <tr style={{ background: "#f5ede0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "2px solid #c9a96e" }}>Destination</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "2px solid #c9a96e" }}>Délai estimé</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "2px solid #c9a96e" }}>Frais</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["🇨🇦 Canada", "7 – 14 jours ouvrables", "Gratuit dès 50$ / sinon 9,99$"],
                  ["🇺🇸 États-Unis", "7 – 15 jours ouvrables", "Gratuit dès 50$ / sinon 12,99$"],
                  ["🇭🇹 Haïti", "14 – 21 jours ouvrables", "Gratuit dès 50$ / sinon 14,99$"],
                  ["🌍 Europe", "10 – 20 jours ouvrables", "Calculé au checkout"],
                  ["🌏 Asie / Pacifique", "14 – 25 jours ouvrables", "Calculé au checkout"],
                  ["🌎 Reste du monde", "14 – 30 jours ouvrables", "Calculé au checkout"],
                ].map(([dest, delay, cost], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #eee" }}>{dest}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #eee" }}>{delay}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #eee" }}>{cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 13, color: "#888", marginTop: 12 }}>* Les délais sont estimatifs et peuvent varier. Ils ne comprennent pas les délais de traitement.</p>
          </Section>

          <Section title="3. Suivi de commande">
            Une fois votre commande expédiée, vous recevrez un courriel avec votre numéro de suivi. Vous pouvez suivre votre colis directement sur notre page <a href="/track" style={{ color: "#c9a96e" }}>Suivi de commande</a> ou via le site du transporteur.<br /><br />
            Si vous n'avez pas reçu de courriel de suivi après 5 jours ouvrables, vérifiez votre dossier spam ou contactez-nous.
          </Section>

          <Section title="4. Douanes et taxes d'importation">
            Pour les livraisons internationales, des frais de douane, taxes ou droits d'importation peuvent s'appliquer selon la réglementation de votre pays. Ces frais sont <strong>entièrement à la charge du destinataire</strong> et ne sont pas inclus dans le prix de la commande.<br /><br />
            Missa Shop n'a aucun contrôle sur ces frais et ne peut pas en prédire le montant. Nous vous recommandons de vous renseigner auprès des autorités douanières de votre pays avant de passer commande.
          </Section>

          <Section title="5. Adresse de livraison">
            Il est de la responsabilité du client de fournir une adresse de livraison exacte et complète. Missa Shop ne pourra être tenu responsable des retards ou non-livraisons causés par une adresse incorrecte ou incomplète. Des frais supplémentaires peuvent s'appliquer pour la réexpédition d'un colis retourné suite à une adresse erronée.
          </Section>

          <Section title="6. Colis perdus ou endommagés">
            <strong>Colis perdu :</strong> Si votre commande n'arrive pas dans le délai maximum estimé, contactez-nous à <strong>support@missashop.com</strong>. Nous ouvrirons une enquête. Si le colis est confirmé perdu, nous vous proposerons un réenvoi ou un remboursement complet.<br /><br />
            <strong>Colis endommagé :</strong> Si vous recevez un colis visiblement endommagé, photographiez-le avant de l'ouvrir et contactez-nous immédiatement avec les photos. Nous traiterons votre dossier en priorité.
          </Section>

          <Section title="7. Livraison express">
            Des options de livraison express peuvent être disponibles selon votre région au moment du checkout. Ces options sont proposées à titre payant et font l'objet de délais garantis par le transporteur.
          </Section>

          <Section title="8. Contact">
            Pour toute question relative à la livraison de votre commande :<br /><br />
            <strong>Missa Shop — Service Expédition</strong><br />
            Email : <strong>support@missashop.com</strong><br />
            Page suivi : <a href="/track" style={{ color: "#c9a96e" }}>www.missashop.com/track</a>
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
