export type Category = {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  order: number;
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
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type OrderPayload = {
  customerName: string;
  phone: string;
  items: CartItem[];
  total: number;
};
