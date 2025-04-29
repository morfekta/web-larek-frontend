// Товар
export interface IProduct {
	id: string;
	description: string;
	image: string;
	title: string;
	category: string;
	price: number | null;
}

// Типы оплаты
export enum PaymentMethod {
	Card = 'card',
	Cash = 'cash',
}

// Форма заказа
export interface IOrderForm {
	payment: PaymentMethod;
	email: string;
	phone: string;
	address: string;
}

// Заказ, отправляемый на сервер
export interface IOrder extends IOrderForm {
	total: number;
	items: IProduct['id'][]; // массив id товаров
}

// Ответ сервера на заказ
export interface IOrderResponse {
	id: string;
	total: number;
}

// Общий тип для ошибок форм
export type FormErrors<T extends object> = Partial<Record<keyof T, string>>;

// Событие смены значения
export interface FormChangeEvent<T extends object> {
	field: keyof T;
	value: T[keyof T];
}

// Состояние всего приложения
export interface IAppState {
	products: IProduct[];
	preview: string | null;
	basket: IProduct[];
}
