import { Component } from '../base/Component';
import { IProduct } from '../../types';
import { ensureElement } from '../../utils/utils';

const mapClass: Record<string, string> = {
	'софт-скил': 'soft',
	'хард-скил': 'hard',
	'другое': 'other',
	'дополнительное': 'additional',
	'кнопка': 'button',
};

// Действия по клику на карточку
interface ICardActions {
	onClick: (event: MouseEvent) => void;
}

export class Card extends Component<IProduct> {
	protected _description?: HTMLElement;
	protected _image?: HTMLImageElement;
	protected _title: HTMLElement;
	protected _category?: HTMLElement;
	protected _price: HTMLElement;
	protected button?: HTMLButtonElement;
	protected _buttonText?: string;
	protected _index?: HTMLElement;

	constructor(container: HTMLElement, actions?: ICardActions) {
		super(container);

		this._description = container.querySelector(`.card__text`);
		this._image = container.querySelector(`.card__image`);
		this._title = ensureElement<HTMLElement>(`.card__title`, container);
		this._category = container.querySelector(`.card__category`);
		this._price = ensureElement<HTMLElement>(`.card__price`, container);
		this.button = container.querySelector(`.card__button`);
		this._index = container.querySelector(`.basket__item-index`);

		if (actions?.onClick) {
			if (this.button) {
				this.button.addEventListener('click', actions.onClick);
			} else {
				container.addEventListener('click', actions.onClick);
			}
		}
	}

	set id(value: string) {
		this.container.dataset.id = value;
	}

	get id(): string {
		return this.container.dataset.id || '';
	}

	set description(value: string) {
		this.setText(this._description, value);
	}

	set image(value: string) {
		this.setImage(this._image, value, this.title);
	}

	set title(value: string) {
		this.setText(this._title, value);
	}

	set category(value: string) {
		this.setText(this._category, value);
		this.toggleClass(this._category, `card__category_${mapClass[value]}`, true);
	}

	set price(value: number | null) {
		if (value === null) {
			this.setText(this._price, 'Бесценно');
			if (this.button) this.setDisabled(this.button, true);
		} else {
			this.setText(this._price, `${value} синапсов`);
		}
	}

	set index(value: number) {
		this.setText(this._index, value);
	}

	set buttonText(value: string) {
		this.setText(this.button, value);
	}
}
