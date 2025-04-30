import { Model } from '../base/Model';
import {
	IProduct,
	IAppState,
	IOrderForm,
	FormErrors,
	PaymentMethod,
} from '../../types';
import { Events } from '../../utils/constants';

// Событие изменения списка продуктов
export type ProductsChangeEvent = {
	products: Product[];
};

// Событие изменения формы заказа
export type OrderFormChangeEvent = {
	field: keyof IOrderForm;
	value: string;
};

// Событие валидации текущей формы заказа
export type OrderFormValidateEvent = {
	errors: FormErrors<IOrderForm>;
	valid: boolean;
};

// Событие готовности к отправке заказа
export type OrderSubmitEvent = {
	order: IOrderForm;
	total: number;
	items: string[];
};

// Модель товара
export class Product extends Model<IProduct> {
	id: string;
	description: string;
	image: string;
	title: string;
	category: string;
	price: number | null;
}

// Основная модель приложения: хранит товары, корзину и состояние оформления заказа
export class AppState extends Model<IAppState> {
	products: Product[] = [];
	preview: string | null = null;
	basket: Product[] = [];

	// Данные формы заказа
	orderForm: IOrderForm = {
		payment: PaymentMethod.Card,
		email: '',
		phone: '',
		address: '',
	};

	// Ошибки текущей формы заказа
	formErrors: FormErrors<IOrderForm> = {};

	// Устанавливает список продуктов и уведомляет UI
	setProducts(items: IProduct[]) {
		this.products = items.map((item) => new Product(item, this.events));
		this.emitChanges(Events.ITEMS_CHANGED, { products: this.products });
	}

	// Задает товар для предпросмотра
	setPreview(item: Product) {
		this.preview = item.id;
		this.emitChanges(Events.PREVIEW_CHANGED, item);
	}

	// Добавляет или удаляет товар в корзине, при цене=null блокирует
	toggleProduct(item: Product) {
		// Добавляем проверку на товар с нулевой ценой, так как атрибут disabled можно обойти
		if (item.price === null) {
			console.warn(`Нельзя добавить товар ${item.id} без цены`);
			return;
		}
		const exists = this.basket.some((p) => p.id === item.id);
		this.basket = exists
			? this.basket.filter((p) => p.id !== item.id)
			: [...this.basket, item];

		this.emitChanges(Events.BASKET_CHANGED, {
			items: this.basket,
			total: this.getTotal(),
		});
	}

	// Сбрасывает корзину
	clearCart() {
		this.basket = [];
		this.emitChanges(Events.BASKET_CHANGED, { items: [], total: 0 });
	}

	// Вычисляет общую сумму корзины
	getTotal(): number {
		return this.basket.reduce((sum, p) => sum + (p.price ?? 0), 0);
	}

	// Обновляет поле формы заказа и выполняет валидацию текущего шага
	setOrderField<K extends keyof IOrderForm>(field: K, value: IOrderForm[K]) {
		this.orderForm[field] = value as any;
		const step = field === 'payment' || field === 'address' ? 'delivery' : 'contacts'; // Определяем, какой шаг валидировать
    this.validateStep(step, field);
	}

	// Валидация формы заказа
	validateStep(
		step: 'delivery' | 'contacts',
		changedField?: keyof IOrderForm
	): boolean {
		const errors: FormErrors<IOrderForm> = {};

		if (step === 'delivery') {
			if (!this.orderForm.address) {
				errors.address = 'Адрес обязателен';
			}
		} else {
			// Проверяем email при изменении email или при финальной проверке
			const email = this.orderForm.email;
			if (changedField === 'email' || changedField === undefined) {
				if (!email) {
					errors.email = 'Email обязателен';
				} else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
					errors.email = 'Неверный формат email';
				}
			}
			// Проверяем телефон
			const phone = this.orderForm.phone;
			if (changedField === 'phone' || changedField === undefined) {
				if (!phone) {
					errors.phone = 'Телефон обязателен';
				} else if (!/^\+?\d{7,15}$/.test(phone)) {
					errors.phone = 'Неверный формат телефона';
				}
			}
		}

		this.formErrors = errors;

		// Определяем, можно ли разблокировать кнопку
		let valid: boolean;
		if (step === 'delivery') {
			valid = !!this.orderForm.address;
		} else {
			// оба поля должны быть корректны одновременно
			const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.orderForm.email);
			const phoneOk = /^\+?\d{7,15}$/.test(this.orderForm.phone);
			valid = emailOk && phoneOk;
		}

		this.emitChanges(Events.FORM_VALIDATED, { errors, valid });
		return valid;
	}

	// Финальная отправка заказа: полная валидация обоих шагов и эмит события
	submitOrder() {
		const okDelivery = this.validateStep('delivery');
    const okContacts = this.validateStep('contacts');
    if (!okDelivery || !okContacts) return;

		const payload: OrderSubmitEvent = {
			order: this.orderForm,
			total: this.getTotal(),
			items: this.basket.map((p) => p.id),
		};
		this.emitChanges(Events.FORM_SUBMITTED, payload);
	}
}
