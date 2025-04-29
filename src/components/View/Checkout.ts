import { Form } from './common/Form';
import { IOrderForm, PaymentMethod } from '../../types';
import { IEvents } from '../base/events';
import { ensureElement } from '../../utils/utils';

export class DeliveryStep extends Form<IOrderForm> {
	protected cardBtn: HTMLButtonElement;
	protected cashBtn: HTMLButtonElement;

	constructor(container: HTMLFormElement, events: IEvents) {
		super(container, events);

		this.cardBtn = ensureElement<HTMLButtonElement>(
			'button[name=card]',
			container
		);
		this.cashBtn = ensureElement<HTMLButtonElement>(
			'button[name=cash]',
			container
		);

		this.cardBtn.addEventListener('click', () => {
			events.emit(`${container.name}.payment:change`, {
				field: 'payment',
				value: PaymentMethod.Card,
			});
		});
		this.cashBtn.addEventListener('click', () => {
			events.emit(`${container.name}.payment:change`, {
				field: 'payment',
				value: PaymentMethod.Cash,
			});
		});
	}

	set payment(value: PaymentMethod) {
		this.cardBtn.classList.toggle(
			'button_alt-active',
			value === PaymentMethod.Card
		);
		this.cashBtn.classList.toggle(
			'button_alt-active',
			value === PaymentMethod.Cash
		);
	}

	set address(value: string) {
		(this.container.elements.namedItem('address') as HTMLInputElement).value =
			value;
	}
}

export class CustomerStep extends Form<IOrderForm> {
	constructor(container: HTMLFormElement, events: IEvents) {
		super(container, events);
	}

	set email(value: string) {
		(this.container.elements.namedItem('email') as HTMLInputElement).value =
			value;
	}

	set phone(value: string) {
		(this.container.elements.namedItem('phone') as HTMLInputElement).value =
			value;
	}
}
