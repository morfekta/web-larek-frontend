// Товар
export interface IProduct {
  id: string;
  description: string;
  image: string;
  title: string;
  category: string;
  price: number | null;
}

// Массив товаров с сервера
export interface IProductList {
  total: number;
  items: IProduct[];
}

// Типы оплаты
export enum PaymentMethod {
  Online = 'online',
  Cash = 'cash'
}

// Форма заказа, заполняемая пользователем
export interface IOrderFormState {
  payment: PaymentMethod;
  email: string;
  phone: string;
  address: string;
}

// Заказ, отправляемый на сервер
export interface IOrderRequest extends IOrderFormState {
  total: number;
  items: IProduct['id'][];
}

// Элемент корзины
export interface ICartItem {
  id: IProduct['id'];
  title: IProduct['title'];
  price: IProduct['price'];
}

// Корзина
export interface ICart {
  items: ICartItem[];
  total: number;
}

// Ошибка валидации формы
export type FormErrors = Partial<Record<keyof IOrderFormState, string>>;

// Интерфейс класса для управления товарами
// Включает в себя методы для получения товара по id, установки товаров и установки превью
export interface IProductState {
  items: IProduct[];
  preview: string | null;

  setProducts(products: IProduct[]): void;
  setPreview(id: string | null): void;
  getProduct(id: string): IProduct | undefined;
}

// Интерфейс класса для управления корзиной
// Включает в себя методы для добавления, удаления и очистки товаров в корзине
export interface ICartState {
  items: ICartItem[];

  add(product: IProduct): void;
  remove(id: string): void;
  clear(): void;
  has(id: string): boolean;
  getCart(): ICart; // возвращает товары и total
}

// Интерфейс класса для управления формой заказа
// Включает в себя методы для обновления формы, валидации формы и получения заказа
export interface IOrderState {
  form: Partial<IOrderFormState>;
  errors: FormErrors;

  update(data: Partial<IOrderFormState>): void;
  validateStep1(): boolean;
  validateStep2(): boolean;
  getRequest(cart: ICart): IOrderRequest;
  clear(): void;
}

// Типы для представления

// Товар для отображения в каталоге
export type TProductCatalog = Pick<IProduct, 'image' | 'title' | 'category' | 'price'>;

// Товар для отображения в карточке товара
export type TProductCard = Pick<IProduct, 'description' | 'image'| 'title' | 'category' | 'price'>;

// Товар для отображения в корзине
export type TProductCart = Pick<IProduct, 'title' | 'price'>;

// Первая часть оформления заказа
export type TOrderFirstPart = Pick<IOrderFormState, 'payment' | 'address'>;

// Вторая часть оформления заказа
export type TOrderSecondPart = Pick<IOrderFormState, 'email' | 'phone'>;