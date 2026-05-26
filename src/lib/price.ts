type PriceTiers = {
  price1: number;
  price2: number | null;
  price3: number | null;
  price4: number | null;
};

type WithLink = {
  price: number;
  priceList: number;
  borgestProduct?: PriceTiers | null;
};

export function resolvePrice(p: WithLink): number {
  if (!p.borgestProduct) return p.price;
  const b = p.borgestProduct;
  const tiered = p.priceList === 2 ? b.price2 : p.priceList === 3 ? b.price3 : p.priceList === 4 ? b.price4 : b.price1;
  return tiered ?? b.price1 ?? p.price;
}
