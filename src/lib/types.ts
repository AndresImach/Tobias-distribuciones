export type Category = {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  order: number;
};

export type BorgestProduct = {
  id: number;
  name: string;
  barcode: string | null;
  price1: number;
  price2: number | null;
  price3: number | null;
  price4: number | null;
  stock: number;
  estado: string;
  foto: string | null;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  featured: boolean;
  categoryId: number;
  category?: Category;
  borgestProductId: number | null;
  priceList: number;
  borgestProduct?: BorgestProduct | null;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type WhatsappContact = {
  name: string;
  number: string;
};

export type OrderPayload = {
  customerName: string;
  phone: string;
  items: CartItem[];
  total: number;
  whatsappNumber?: string;
};
