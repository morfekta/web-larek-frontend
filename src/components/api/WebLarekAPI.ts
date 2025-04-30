import { Api, ApiListResponse } from '../base/api';
import { IProduct, IOrder, IOrderResponse } from '../../types';

export interface IWebLarekAPI {
	getProductList: () => Promise<IProduct[]>;
	getProduct: (id: string) => Promise<IProduct>;
	order: (order: IOrder) => Promise<IOrderResponse>;
}

export class WebLarekAPI extends Api implements IWebLarekAPI {
	readonly cdn: string;

	constructor(cdn: string, baseUrl: string, options?: RequestInit) {
		super(baseUrl, options);
		this.cdn = cdn;
	}

	getProductList(): Promise<IProduct[]> {
		return this.get('/product/').then((data: ApiListResponse<IProduct>) =>
			data.items.map((item) => ({
				...item,
				image: this.cdn + item.image.replace(".svg", ".png")
			}))
		);
	}

	getProduct(id: string): Promise<IProduct> {
		return this.get(`/product/${id}`).then((item: IProduct) => ({
			...item,
			image: this.cdn + item.image,
		}));
	}

	order(order: IOrder): Promise<IOrderResponse> {
		return this.post('/order', order).then((data: IOrderResponse) => data);
	}
}
