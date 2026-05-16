// Small badge for product cards showing it's a dropship product

export default function DropshipBadge({
  shippingTime = '7-15 jours'
}: {
  shippingTime?: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-blue-500 font-semibold">
      <span>🌍</span>
      <span>Livraison {shippingTime}</span>
    </div>
  )
}
