import { Model } from '../base/Model';
import {
	IProduct,
	IAppState,
	IOrderForm,
	FormErrors,
	PaymentMethod,
} from '../../types';
import {
	Events,
	ValidationMessages,
	ValidationRegex,
} from '../../utils/constants';

// Событие изменения списка продуктов
export type ProductsChangeEvent = {
	products: IProduct[];
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

// Основная модель приложения: хранит товары, корзину и состояние оформления заказа
export class AppState extends Model<IAppState> {
	products: IProduct[] = [];
	preview: string | null = null;
	basket: IProduct[] = [];

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
		this.products = items;
		this.emitChanges(Events.ITEMS_CHANGED, { products: this.products });
	}

	// Задает товар для предпросмотра
	setPreview(item: IProduct) {
		this.preview = item.id;
		this.emitChanges(Events.PREVIEW_CHANGED, item);
	}

	// Добавляет или удаляет товар в корзине, при цене=null блокирует
	toggleProduct(item: IProduct) {
		// Добавляем проверку на товар с нулевой ценой, так как атрибут disabled можно обойти
		if (item.price === null) {
			console.warn(ValidationMessages.PRICE_REQUIRED(item.id));
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

	// Сбрасывает форму заказа
	clearOrderForm() {
		this.orderForm = {
			payment: PaymentMethod.Card,
			email: '',
			phone: '',
			address: '',
		};
		this.formErrors = {};
		this.emitChanges(Events.FORM_RESET, this.orderForm);
	}

	// Вычисляет общую сумму корзины
	getTotal(): number {
		return this.basket.reduce((sum, p) => sum + (p.price ?? 0), 0);
	}

	// Обновляет поле формы заказа и выполняет валидацию текущего шага
	setOrderField<K extends keyof IOrderForm>(field: K, value: IOrderForm[K]) {
		this.orderForm[field] = value;
		const step =
			field === 'payment' || field === 'address' ? 'delivery' : 'contacts'; // Определяем, какой шаг валидировать
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
				errors.address = ValidationMessages.ADDRESS_REQUIRED;
			}
		} else {
			// Проверяем email при изменении email или при финальной проверке
			const email = this.orderForm.email;
			if (changedField === 'email' || changedField === undefined) {
				if (!email) {
					errors.email = ValidationMessages.EMAIL_REQUIRED;
				} else if (!ValidationRegex.EMAIL.test(email)) {
					errors.email = ValidationMessages.EMAIL_INVALID;
				}
			}
			// Проверяем телефон
			const phone = this.orderForm.phone;
			if (changedField === 'phone' || changedField === undefined) {
				if (!phone) {
					errors.phone = ValidationMessages.PHONE_REQUIRED;
				} else if (!ValidationRegex.PHONE.test(phone)) {
					errors.phone = ValidationMessages.PHONE_INVALID;
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
			const emailOk = ValidationRegex.EMAIL.test(this.orderForm.email);
			const phoneOk = ValidationRegex.PHONE.test(this.orderForm.phone);
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
