// Глобальные стили
import './scss/styles.scss';

// API и константы
import { WebLarekAPI } from './components/api/WebLarekAPI';
import { API_URL, CDN_URL } from './utils/constants';
import { Events } from './utils/constants';

// Брокер событий
import { EventEmitter } from './components/base/events';

// Утилиты для работы с DOM
import { cloneTemplate, ensureElement } from './utils/utils';

// Модель данных
import {
	ProductsChangeEvent,
	Product,
	AppState,
} from './components/Model/AppData';

// Компоненты интерфейса
import { Page } from './components/View/Page';
import { Modal } from './components/View/common/Modal';
import { Basket } from './components/View/common/Basket';
import { DeliveryStep, CustomerStep } from './components/View/Checkout';
import { Card } from './components/View/Card';
import { Success } from './components/View/common/Success';

// Типы для формы заказа
import { IOrderForm, FormErrors, PaymentMethod } from './types';

// ---------------------------------------------
// Инициализация
// ---------------------------------------------
const eventBus = new EventEmitter();
const apiClient = new WebLarekAPI(CDN_URL, API_URL);
const appState = new AppState({}, eventBus);

// ---------------------------------------------
// Темплейты
// ---------------------------------------------
const templates = {
	success: ensureElement<HTMLTemplateElement>('#success'),
	cardCatalog: ensureElement<HTMLTemplateElement>('#card-catalog'),
	cardPreview: ensureElement<HTMLTemplateElement>('#card-preview'),
	cardBasket: ensureElement<HTMLTemplateElement>('#card-basket'),
	basket: ensureElement<HTMLTemplateElement>('#basket'),
	order: ensureElement<HTMLTemplateElement>('#order'),
	contacts: ensureElement<HTMLTemplateElement>('#contacts'),
};

// ---------------------------------------------
// UI: контейнеры и компоненты
// ---------------------------------------------
const page = new Page(document.body, eventBus);
const modal = new Modal(
	ensureElement<HTMLElement>('#modal-container'),
	eventBus
);

const basketView = new Basket(cloneTemplate(templates.basket), eventBus);
const deliveryForm = new DeliveryStep(cloneTemplate(templates.order), eventBus);
const contactForm = new CustomerStep(
	cloneTemplate(templates.contacts),
	eventBus
);

// Храним текущий шаг двушаговой формы
let currentStep: 'delivery' | 'contacts' = 'delivery';

// ---------------------------------------------
// Рендеринг каталога
// ---------------------------------------------
function renderCatalog(products: Product[]) {
	page.products = products.map((item) => {
		const card = new Card(cloneTemplate(templates.cardCatalog), {
			onClick: () => eventBus.emit(Events.CARD_SELECT, item),
		});
		return card.render(item);
	});
}

// ---------------------------------------------
// Рендеринг корзины (в модальном окне)
// ---------------------------------------------
function renderBasket(items: Product[], total: number) {
	// обновляем счётчик
	page.counter = items.length;

	const cards = items.map((item, idx) => {
		const card = new Card(cloneTemplate(templates.cardBasket), {
			onClick: () => eventBus.emit(Events.PRODUCT_TOGGLE, item),
		});
		card.index = idx + 1;
		return card.render({ title: item.title, price: item.price });
	});

	return basketView.render({
		items: cards,
		total,
		selected: items.map((p) => p.id),
	});
}

// ---------------------------------------------
// Подписки на события
// ---------------------------------------------

// При загрузке данных каталога
eventBus.on<ProductsChangeEvent>(Events.ITEMS_CHANGED, ({ products }) => {
	renderCatalog(products);
});

// Пользователь выбрал карточку товара
eventBus.on<Product>(Events.CARD_SELECT, (item) => {
	appState.setPreview(item);
});

// Показ превью товара в модалке
eventBus.on<Product>(Events.PREVIEW_CHANGED, (item) => {
	const card = new Card(cloneTemplate(templates.cardPreview), {
		onClick: () => {
			eventBus.emit(Events.PRODUCT_TOGGLE, item);
			card.buttonText = appState.basket.includes(item)
				? 'Убрать из корзины'
				: 'В корзину';
		},
	});
	card.buttonText = appState.basket.includes(item)
		? 'Убрать из корзины'
		: 'В корзину';

	modal.render({ content: card.render(item) });
});

// Тоггл товара
eventBus.on<Product>(Events.PRODUCT_TOGGLE, (item) => {
	appState.toggleProduct(item);
});

// Открытие корзины
eventBus.on(Events.BASKET_OPEN, () => {
	const content = renderBasket(appState.basket, appState.getTotal());
	modal.render({ content });
});

// Обновление корзины
eventBus.on<{ items: Product[]; total: number }>(
	Events.BASKET_CHANGED,
	({ items, total }) => renderBasket(items, total)
);

// Открытие первого шага формы оформления заказа
eventBus.on(Events.ORDER_OPEN, () => {
	currentStep = 'delivery';
	const { payment, address } = appState.orderForm;
	const isAddressFilled = Boolean(address);
	const content = deliveryForm.render({
		valid: isAddressFilled,
		errors: '',
		payment,
		address,
	});

	modal.render({ content });
});

// Переход ко второму шагу (контакты)
eventBus.on(Events.ORDER_SUBMIT, () => {
	currentStep = 'contacts';
	modal.render({
		content: contactForm.render({
			valid: false,
			errors: '',
			email: appState.orderForm.email,
			phone: appState.orderForm.phone,
		}),
	});
});

// Финальная отправка
eventBus.on(Events.CONTACTS_SUBMIT, () => {
	appState.submitOrder();
});

// Обработка изменений полей формы
eventBus.on<{ field: keyof IOrderForm; value: string }>(
	Events.FORM_FIELD_CHANGE,
	({ field, value }) => {
		appState.setOrderField(field, value);
		if (field === 'payment') {
			deliveryForm.payment = value as PaymentMethod;
		}
	}
);

// Подписка на валидацию шага (разблокировка кнопки)
eventBus.on<{ errors: FormErrors<IOrderForm>; valid: boolean }>(
	Events.FORM_VALIDATED,
	({ errors, valid }) => {
		const message = Object.values(errors).join(', ');
		if (currentStep === 'delivery') {
			deliveryForm.valid = valid;
			deliveryForm.errors = message;
		} else {
			contactForm.valid = valid;
			contactForm.errors = message;
		}
	}
);

// Отправка заказа на сервер и показ экрана успеха
eventBus.on<{
	order: IOrderForm;
	total: number;
	items: string[];
}>(Events.FORM_SUBMITTED, ({ order, total, items }) => {
	apiClient
		.order({ ...order, total, items })
		.then(() => {
			const successComp = new Success(cloneTemplate(templates.success), {
				onClick: () => modal.close(),
			});
			modal.render({ content: successComp.render({ total }) });
			appState.clearCart();
		})
		.catch(console.error);
});

// Блокировка скролла при открытии/закрытии модалки
eventBus.on('modal:open', () => (page.locked = true));
eventBus.on('modal:close', () => (page.locked = false));

// Загрузка товаров с сервера
apiClient
	.getProductList()
	.then(appState.setProducts.bind(appState))
	.catch(console.error);
