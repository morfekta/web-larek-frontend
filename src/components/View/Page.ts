import { Component } from '../base/Component';
import { IEvents } from '../base/events';
import { ensureElement } from '../../utils/utils';
import { Events } from '../../utils/constants';

interface IPage {
	counter: number;
	products: HTMLElement[];
	locked: boolean;
}

export class Page extends Component<IPage> {
	protected _counter: HTMLElement;
	protected _products: HTMLElement;
	protected wrapper: HTMLElement;
	protected basket: HTMLElement;

	constructor(container: HTMLElement, protected events: IEvents) {
		super(container);

		this._counter = ensureElement<HTMLElement>('.header__basket-counter');
		this._products = ensureElement<HTMLElement>('.gallery');
		this.wrapper = ensureElement<HTMLElement>('.page__wrapper');
		this.basket = ensureElement<HTMLElement>('.header__basket');

		this.basket.addEventListener('click', () => {
			this.events.emit(Events.BASKET_OPEN);
		});
	}

	set counter(value: number) {
		this.setText(this._counter, String(value));
	}

	set products(items: HTMLElement[]) {
		this._products.replaceChildren(...items);
	}

	// Блокирует страницу при открытии модального окна
	set locked(value: boolean) {
		if (value) {
			this.wrapper.classList.add('page__wrapper_locked');
		} else {
			this.wrapper.classList.remove('page__wrapper_locked');
		}
	}
}
