export const API_URL = `${process.env.API_ORIGIN}/api/weblarek`;
export const CDN_URL = `${process.env.API_ORIGIN}/content/weblarek`;

export const settings = {};

export const Events = {
	ITEMS_CHANGED: 'items:changed' as const,
	PREVIEW_CHANGED: 'preview:changed' as const,
	CARD_SELECT: 'card:select' as const,
	PRODUCT_TOGGLE: 'product:toggle' as const,
	BASKET_OPEN: 'basket:open' as const,
	BASKET_CHANGED: 'basket:changed' as const,
	ORDER_OPEN: 'order:open' as const,
	ORDER_SUBMIT: 'order:submit' as const,
	CONTACTS_SUBMIT: 'contacts:submit' as const,

	MODAL_OPEN: 'modal:open' as const,
	MODAL_CLOSE: 'modal:close' as const,

	FORM_FIELD_CHANGE:
		/^(?:order|contacts)\.(payment|address|email|phone):change$/,
	FORM_VALIDATED: 'orderForm:validated' as const,
	FORM_SUBMITTED: 'orderForm:submitted' as const,
	FORM_RESET: 'orderForm:reset' as const,
};

export const ValidationMessages = {
  ADDRESS_REQUIRED: 'Адрес обязателен',
  EMAIL_REQUIRED: 'Email обязателен',
  EMAIL_INVALID: 'Неверный формат email',
  PHONE_REQUIRED: 'Телефон обязателен',
  PHONE_INVALID: 'Неверный формат телефона',
  PRICE_REQUIRED: (id: string) => `Нельзя добавить товар ${id} без цены`,
};

export const ValidationRegex = {
  EMAIL: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, 
  PHONE: /^\+?\d{7,15}$/,
};