# Проектная работа "Веб-ларек"

Стек: HTML, SCSS, TS, Webpack

Структура проекта:
- src/ — исходные файлы проекта
- src/components/ — папка с JS компонентами
- src/components/base/ — папка с базовым кодом

Важные файлы:
- src/pages/index.html — HTML-файл главной страницы
- src/types/index.ts — файл с типами
- src/index.ts — точка входа приложения
- src/scss/styles.scss — корневой файл стилей
- src/utils/constants.ts — файл с константами
- src/utils/utils.ts — файл с утилитами

## Установка и запуск
Для установки и запуска проекта необходимо выполнить команды

```
npm install
npm run start
```

или

```
yarn
yarn start
```
## Сборка

```
npm run build
```

или

```
yarn build
```

## Данные и типы данных, используемые в приложении

Товар
```
export interface IProduct {
  id: string;
  description: string;
  image: string;
  title: string;
  category: string;
  price: number | null;
}
```

Способы оплаты
```
export enum PaymentMethod {
  Card = 'card',
  Cash = 'cash',
}
```

Данные формы заказа
```
export interface IOrderForm {
  payment: PaymentMethod;
  email: string;
  phone: string;
  address: string;
}
```

Заказ, отправляемый на сервер
```
export interface IOrder extends IOrderForm {
  total: number;
  items: IProduct['id'][];
}
```

Ответ сервера
```
export interface IOrderResponse {
  id: string;
  total: number;
}
```

Ошибки формы
```
export type FormErrors<T extends object> = Partial<Record<keyof T, string>>;
```

Состояние приложения
```
export interface IAppState {
  products: IProduct[];
  preview: string | null;
  basket: IProduct[];
}
```

## Архитектура приложения

Код приложения разделен на слои согласно парадигме MVP: 
- слой представления, отвечает за отображение данных на странице
- слой данных, отвечает за хранение и изменение данных
- презентер, отвечает за связь представления и данных.

### Базовый код

#### Класс Api
Содержит в себе базовую логику отправки запросов. В конструктор передается базовый адрес сервера и опциональный объект с заголовками запросов.
Методы: 
- `handleResponse(response: Response): Promise<object>` - если response.ok, возвращает распарсенный JSON; иначе читает тело ошибки и отклоняет промис.
- `get(uri: string): Promise<object>` - выполняет GET запрос по адресу baseUrl + uri и обрабатывает ответ через `handleResponse`.
- `post(uri: string, data: object, method: ApiPostMethods = 'POST'): Promise<object>` - выполняет запрос POST, PUT или DELETE к baseUrl + uri с JSON-телом data, возвращает результат через `handleResponse`

#### Слой событий: EventEmitter  
Брокер событий позволяет отправлять события и подписываться на события, происходящие в системе.. Класс используется в презентере для обработки событий и в слоях приложения для генерации событий.  
Основные методы, реализуемые классом описаны интерфейсом `IEvents`:

**Методы:**  
- `on(event: string \| RegExp, handler: Function): void` — подписка на событие или паттерн.  
- `emit(event: string, data?: any): void` — генерация события с именем и данными.  
- `onAll(handler: ({ eventName, data }) => void): void` — подписка на все события (например, для логирования).

#### Базовый UI-компонент: Component<T>  
Родитель для всех View-классов, умеет «привязывать» данные к DOM. В дженерик принимает тип объекта, в котором данные будут передаваться в метод render для отображения данных в компоненте. В конструктор принимает элемент разметки, являющийся основным родительским контейнером компонента. Содержит метод render, отвечающий за сохранение полученных в параметре данных в полях компонентов через их сеттеры, возвращает обновленный контейнер компонента.

**Конструктор:**  
- `new Component(container: HTMLElement)` — сохраняет корневой элемент.

**Методы:**  
- `render(data: Partial<T>): HTMLElement` — вызывает все подходящие сеттеры и возвращает обновлённый контейнер.  
- `setText(el: HTMLElement \| undefined, text: string): void` — обновляет `textContent`.  
- `setImage(el: HTMLImageElement \| undefined, src: string, alt: string): void` — обновляет `src` и `alt`.  
- `setDisabled(el: HTMLElement \| undefined, state: boolean): void` — добавляет/удаляет `disabled`.  
- `toggleClass(el: HTMLElement \| undefined, className: string, state: boolean): void` — переключает CSS-класс.

### Слой данных AppState
Отвечает за бизнес-логику: хранение товаров, корзины и процесса оформления заказа. Управляет:
- Каталогом: загрузка списка товаров `setProducts`, выбор предпросмотра `setPreview`.
- Корзиной: добавление/удаление товаров `toggleProduct`, подсчёт суммы `getTotal`, очистка `clearCart`.
- Формой заказа: хранение полей `orderForm`, ошибок `formErrors`, обновление полей `setOrderField`, валидацию шагов оформления `validateStep`, отправку заказа `submitOrder`.

**Конструктор:**  
- `new AppState(initialState: IAppState, events: IEvents)` — создаёт модель с начальным `IAppState` и брокером событий.

**Поля:**  
- `products: Product[]` — загруженный каталог.  
- `preview: string|null` — ID товара для предпросмотра.  
- `basket: Product[]` — список выбранных товаров.  
- `orderForm: IOrderForm` — текущие значения полей (payment, email, phone, address).  
- `formErrors: FormErrors<IOrderForm>` — накопленные ошибки валидации.

**Методы:**  
- `setProducts(items: IProduct[]): void` — сохраняет товары, эмитит `items:changed`.  
- `setPreview(item: Product): void` — сохраняет ID предпросмотра, эмитит `preview:changed`.  
- `toggleProduct(item: Product): void` — добавляет/удаляет из корзины (`price!==null`), эмитит `basket:changed`.  
- `getTotal(): number` — считает сумму цен в корзине.  
- `clearCart(): void` — очищает корзину, эмитит `basket:changed`.  
- `setOrderField(field: keyof IOrderForm, value: any): void` — обновляет поле формы, запускает `validateStep`.  
- `validateStep(step: 'delivery'|'contacts', changedField?: keyof IOrderForm): boolean` — проверяет поля текущего шага, эмитит `orderForm:validated`.  
- `submitOrder(): void` — финальная валидация обоих шагов и эмит `orderForm:submitted`.

### Классы представления
Все классы представления отвечают за отображение внутри контейнера (DOM-элемент) передаваемых в них данных.

### Page
Управляет шапкой, счётчиком и галереей товаров.

**Конструктор:**  
- `new Page(container: HTMLElement, events: IEvents)` — находит элементы:  
- `.header__basket-counter`,  
- `.gallery`,  
- `.page__wrapper`,  
- `.header__basket` (клик → `basket:open`).

**Сеттеры:**  
- `counter: number` — обновляет счётчик.  
- `products: HTMLElement[]` — вставляет карточки в галерею.  
- `locked: boolean` — блокирует/разблокирует фон (CSS-класс).

### Modal 
Универсальный контейнер для модальных окон.

**Конструктор:**  
- `new Modal(container: HTMLElement, events: IEvents)` — находит:  
- `.modal__close` (кнопка),  
- `.modal__content`;  
вешает слушатели закрытия (клик и оверлей).

**Сеттеры:**
- `set content(value: HTMLElement)` — заменяет дочерние элементы блока `.modal__content` на переданный элемент `value`.

**Методы:**  
- `render({ content: HTMLElement }): HTMLElement` — заменяет дочерние элементы, вызывает `open()`.  
- `open(): void` — добавляет класс `modal_active` и эмит `modal:open`.  
- `close(): void` — убирает класс, очищает контент, эмит `modal:close`.

### Basket 
Отображает содержимое корзины и кнопку «Оформить».

**Конструктор:**  
- `new Basket(container: HTMLElement, events: IEvents)` — находит:  
  - `.basket__list`,  
  - `.basket__price`,  
  - `.basket__button` (клик → `order:open`).

**Сеттеры:**  
- `items: HTMLElement[]` — рендерит список или «Корзина пуста».  
- `selected: string[]` — включает/выключает кнопку оформления.  
- `total: number` — обновляет текст цены.

### Card
Карточка товара: в каталоге, в просмотре и в корзине.

**Конструктор:**  
- `new Card(root: HTMLElement, actions?: { onClick(e): void })` — находит элементы, вешает клик.

**Сеттеры:**  
- `id: string` — data-id.  
- `title: string`, `description: string`, `image: string`, `category: string`, `price: number|null`.  
- `buttonText: string` — «В корзину» / «Убрать».  
- `index: number` — порядковый номер в списке.

### DeliveryStep (Checkout.ts)
Первый шаг оформления заказа: выбор оплаты и ввод адреса.

**Конструктор:**  
- `new DeliveryStep(container: HTMLFormElement, events: IEvents)` — наследует `Form`, дополнительно вешает клики по `button[name=card]`/`[name=cash]` → `order.payment:change`.

**Сеттеры:**  
- `payment: PaymentMethod` — подсветка активной кнопки.  
- `address: string` — наполнение `input[name=address]`.

### CustomerStep (Checkout.ts)
Второй шаг: ввод email и телефона.

**Конструктор:**  
- `new CustomerStep(container: HTMLFormElement, events: IEvents)` — наследует `Form`, обработка `input` идёт в базовом классе.

**Сеттеры:**  
- `email: string` — заполняет `input[name=email]`.  
- `phone: string` — заполняет `input[name=phone]`.

### Success  
Экран успешного заказа.

**Конструктор:**  
- `new Success(container: HTMLElement, actions: { onClick(): void })` — находит `.order-success__close`.

**Сеттеры:**  
- `total: number` — обновляет текст «Списано X синапсов».

### Слой коммуникации

#### API: WebLarekAPI  
Отвечает за взаимодействие с бэкендом и CDN: загрузку товаров и отправку заказа.

**Конструктор:**  
- `new WebLarekAPI(baseCdnUrl: string, baseApiUrl: string)` — инициализирует клиент с URL-адресами CDN и API.

**Методы:**  
- `getProductList(): Promise<IProduct[]>` — выполняет `GET /product/`, возвращает массив `IProduct`.  
- `order(data: IOrder): Promise<IOrderResponse>` — выполняет `POST /order` с телом `{ total, items, … }`, возвращает `{ id, total }`.  

## Взаимодействие компонентов - Presenter
Код, описывающий взаимодействие представления и данных между собой находится в файле `index.ts`, выполняющем роль презентера.\
Взаимодействие осуществляется за счет событий генерируемых с помощью брокера событий и обработчиков этих событий, описанных в `index.ts`\
В `index.ts` сначала создаются экземпляры всех необходимых классов, а затем настраивается обработка событий.

Связывает Model и View через события:

1. **Инициализация**: создаёт `EventEmitter`, `WebLarekAPI`, `AppState`, клонирует шаблоны, создаёт компоненты.  
2. **Каталог**: `items:changed` → `renderCatalog`.  
3. **Предпросмотр**: `card:select` → `setPreview` → `preview:changed` → `Modal.render`.  
4. **Корзина**: `product:toggle` → `basket:changed` → `renderBasket`; `basket:open` → окно корзины.  
5. **Оформление**:  
   - `order:open` → `DeliveryStep`.  
   - `order.xxx:change` → `setOrderField` → `orderForm:validated`.  
   - `order:submit` → `CustomerStep`.  
   - `contacts:submit` → `submitOrder` → `orderForm:submitted` → API → `Success`.  
6. **Блокировка фона**: слушает `modal:open`/`modal:close` → `page.locked`.  

### События изменения данных (генерируются классами моделей данных)

- `items:changed` — появились или обновились данные каталога (вызывается в `setProducts`).
- `preview:changed` — выбран товар для предпросмотра (вызывается в `setPreview`).
- `basket:changed` — изменилось содержимое корзины (вызывается в `toggleProduct` и `clearCart`), в data передаются `{ items: Product[]; total: number }`.
- `orderForm:validated` — результат валидации текущего шага оформления (`validateStep`), в data передаётся `{ errors: FormErrors<IOrderForm>; valid: boolean }`.
- `orderForm:submitted` — форма заказа прошла полную валидацию и готова к отправке (`submitOrder`), в data передаётся `{ order: IOrderForm; total: number; items: string[] }`.

### События, возникающие при взаимодействии пользователя с интерфейсом (генерируются классами, отвечающими за представление)

- `card:select` — пользователь кликнул по карточке товара в галерее.
- `product:toggle` — пользователь нажал «В корзину» или «Убрать из корзины» в карточке товара.
- `basket:open` — пользователь открыл окно корзины (клик по иконке в шапке).
- `order:open` — пользователь нажал кнопку «Оформить» в корзине.
- `order:submit` — пользователь нажал «Далее» в первом шаге оформления (способ оплаты + адрес).
- `contacts:submit` — пользователь нажал «Оплатить» во втором шаге (email + телефон).
- `modal:open` — любое модальное окно открылось (Modal.open()).
- `modal:close` — любое модальное окно закрылось (Modal.close()).
- `order.payment:change`, `order.address:change`, `contacts.email:change`, `contacts.phone:change` - ввод или выбор в соответствующих полях формы (все обрабатываются общим паттерном `/^(?:order|contacts)\.(payment|address|email|phone):change$/`).