'use client'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'

export default function MentionsLegales() {
  return (
    <>
      <Header />
      <div className="bg-white min-h-screen">
        <div style={{ fontFamily: "'Georgia', serif", maxWidth: 860, margin: "0 auto", padding: "60px 24px", color: "#1a1a1a", lineHeight: 1.8 }}>
          <div style={{ borderBottom: "3px solid #c9a96e", paddingBottom: 32, marginBottom: 48 }}>
            <p style={{ fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "#c9a96e", marginBottom: 12 }}>Missa Shop</p>
            <h1 style={{ fontSize: 38, fontWeight: 300, letterSpacing: 1, margin: 0 }}>Mentions Légales</h1>
            <p style={{ color: "#888", fontSize: 14, marginTop: 12 }}>Dernière mise à jour : 16 mai 2026</p>
          </div>

          <Section title="1. Éditeur du site">
            <strong>Nom de la boutique :</strong> Missa Shop<br />
            <strong>Site web :</strong> www.missashop.com<br />
            <strong>Email :</strong> contact@missashop.com<br />
            <strong>Pays d'exploitation :</strong> Canada<br />
            <strong>Langue principale :</strong> Français
          </Section>

          <Section title="2. Hébergement">
            Ce site est hébergé par des infrastructures cloud modernes garantissant disponibilité, performance et sécurité. Pour toute demande légale concernant l'hébergement, contactez-nous à <strong>legal@missashop.com</strong>.
          </Section>

          <Section title="3. Propriété intellectuelle">
            L'ensemble du contenu de ce site (textes, photographies, visuels, logos, icônes, sons, logiciels, base de données, etc.) est la propriété exclusive de Missa Shop ou de ses ayants droit et est protégé par les lois canadiennes et internationales relatives à la propriété intellectuelle.<br /><br />
            Toute reproduction, représentation, modification, publication, adaptation ou exploitation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de Missa Shop.<br /><br />
            Toute exploitation non autorisée du site ou de l'un quelconque des éléments qu'il contient sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions des articles pertinents du Code criminel canadien.
          </Section>

          <Section title="4. Marques">
            Le nom « Missa Shop », le logo et tous les signes distinctifs associés sont des marques de Missa Shop. Toute utilisation non autorisée est strictement prohibée.
          </Section>

          <Section title="5. Limitation de responsabilité">
            Missa Shop s'efforce de fournir des informations aussi précises que possible sur son site. Toutefois, Missa Shop ne pourra être tenu responsable des omissions, inexactitudes ou carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.<br /><br />
            Missa Shop ne saurait être responsable des dommages directs ou indirects, quelles qu'en soient les causes, origines, natures ou conséquences, résultant de l'accès à notre site ou de l'impossibilité d'y accéder.
          </Section>

          <Section title="6. Liens hypertextes">
            Le site peut contenir des liens vers des sites tiers. Ces liens sont fournis à titre informatif uniquement. Missa Shop n'assume aucune responsabilité quant au contenu de ces sites externes et ne peut garantir leur disponibilité.
          </Section>

          <Section title="7. Données personnelles">
            Conformément à la Loi sur la protection des renseignements personnels dans le secteur privé (Loi 25) du Québec et à la Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE) du Canada, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.<br /><br />
            Pour exercer ces droits, veuillez consulter notre <a href="/legal/confidentialite" style={{ color: "#c9a96e" }}>Politique de Confidentialité</a> ou nous contacter à <strong>privacy@missashop.com</strong>.
          </Section>

          <Section title="8. Cookies">
            Notre site utilise des cookies pour améliorer votre expérience. Pour en savoir plus, veuillez consulter notre <a href="/legal/cookies" style={{ color: "#c9a96e" }}>Politique des Cookies</a>.
          </Section>

          <Section title="9. Droit applicable et juridiction">
            Les présentes mentions légales sont régies par le droit canadien, et plus particulièrement par les lois de la province de Québec. En cas de litige, les tribunaux compétents de la province de Québec auront juridiction exclusive.
          </Section>

          <Section title="10. Contact">
            Pour toute question légale ou administrative :<br /><br />
            <strong>Missa Shop</strong><br />
            Email : <strong>legal@missashop.com</strong><br />
            Site web : <strong>www.missashop.com</strong>
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
