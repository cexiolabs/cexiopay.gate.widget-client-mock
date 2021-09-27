import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { setTimeout } from "node:timers";

export interface WidgetServiceClient {
	//
	// API
	//

	/**
	 * Return current state
	 */
	readonly state: WidgetServiceClient.State | null;

	/**
	 * Get/Set callback delegate to listen state change
	 */
	onStateChanged: WidgetServiceClient.StateChangedCallback;

	/**
	 * Invoke state action (RPC call to server)
	 */
	invoke(action: WidgetServiceClient.StateAction): Promise<void>;


	//
	// Life-cycle
	//

	/**
	 * Dispose all related resources
	 */
	dispose(): Promise<void>;
}

export namespace WidgetServiceClient {

	/**
	 * Represents a currency code, like: "USD", "BTC", etc
	 * @see https://github.com/cexiolabs/cexiopay.schemas/blob/master/api/v3/currency.json
	 */
	export type Currency = string;

	/**
	 * Represents a financial value, like "10.42"
	 * @see https://github.com/cexiolabs/cexiopay.schemas/blob/master/api/v3/primitives.json
	 */
	export type Financial = string;

	/**
	 * Represents an order identifier
	 * @see https://github.com/cexiolabs/cexiopay.schemas/blob/master/gateway/v2/identifier-order.json
	 */
	export type OrderIdentifier = string;

	/**
	 * Represents a rejection reason enum for order object
	 * @see https://github.com/cexiolabs/cexiopay.schemas/blob/master/gateway/v2/order-rejection-reason.json
	 */
	export type RejectionReason = "CANCELED" | "UNPAID" | "EXCHANGE_FAILED";

	/**
	 * Represents an order state
	 * @see https://github.com/cexiolabs/cexiopay.schemas/blob/master/gateway/v2/order-state.json
	 */
	export type OrderState = "AWAIT_DEPOSIT" | "EXCHANGE" | "EXCHANGED" | "COMPLETED" | "REJECTED" | "REQUESTED";

	export interface CurrencyRateMaintenance {
		readonly scheduledUptimeAt: Date | null,
		readonly code: number
	}

	/**
	 * Represents a rate before order is created (for response of /getRates)
	 */
	export interface CurrencyRate {
		readonly from: Currency,
		readonly to: Currency,
		readonly symbol: string,
		readonly base: Financial,
		readonly maintenance: CurrencyRateMaintenance | null
	}

	/**
	 * Represents an order rate
	 * @see https://github.com/cexiolabs/cexiopay.schemas/blob/master/gateway/v2/order-rate.json
	 */
	export interface OrderRate {
		readonly symbol: string,
		readonly rate: Financial
	}

	/**
	 * Represents an order currency
	 * @see https://github.com/cexiolabs/cexiopay.schemas/blob/master/gateway/v2/order-currency.json
	 */
	export interface OrderCurrency {
		readonly currency: Currency,
		readonly amount: Financial
	}

	/**
	 * Represents an order deposit
	 * @see https://github.com/cexiolabs/cexiopay.schemas/blob/master/gateway/v2/order-deposit.json
	 */
	export interface OrderDeposit {
		readonly address: string,
		readonly uri: string,
		readonly amount: Financial,
		readonly underpayment: Financial
	}

	/**
	 * Represents an order object
	 * @see https://github.com/cexiolabs/cexiopay.schemas/blob/master/gateway/v2/order.json
	 */
	export interface Order {
		readonly id: OrderIdentifier,
		readonly confirmedAt: Date | null,
		readonly okRedirect: string | null,
		readonly failRedirect: string | null,
		readonly expiredAt: Date | null,
		readonly rate: OrderRate | null,
		readonly state: OrderState,
		readonly rejectionReason: RejectionReason | null,
		readonly paidStatus: string | null,
		readonly from: OrderCurrency | null,
		readonly to: OrderCurrency,
		readonly deposit: OrderDeposit | null,
		readonly depositAcceptConfirmations: number
	}

	/**
	 * Represents a progress object that can be used for creation of progress bar in the widget.
	 * Total number of pages should be defined as a constant in the widget, but backend can change the order of pages.
	 */
	export interface Progress {
		readonly currentPageNumber: number
	}

	/**
	 * @see ./submodules/schemas/gateway/v3/gate.page-change.SAMPLE-1.json
	 */
	export interface StateChooseInputCurrency {
		readonly step: "CHOOSE_INPUT_CURRENCY",
		readonly rates: ReadonlyArray<CurrencyRate>,
		readonly toAmount: Financial,
		readonly toCurrency: Currency,
		readonly progress: Progress,
		readonly callbackMethodName: string
	}

	/**
	 * @see ./submodules/schemas/gateway/v3/gate.page-change.SAMPLE-2.json
	 */
	export interface StateAskForEmail {
		readonly step: "ASK_FOR_EMAIL",
		readonly email: string | null,
		readonly progress: Progress,
		readonly callbackMethodName: string
	}

	/**
	 * @see ./submodules/schemas/gateway/v3/gate.page-change.SAMPLE-{N}.json
	 * where {N} is 3 to 10
	 */
	export interface StateProcessPayment {
		readonly step: "PROCESS_PAYMENT" | "PAYMENT_RECEIVE" | "PAYMENT_COMPLETED",
		readonly order: Order,
		readonly progress: Progress
	}

	/**
	 * @see ./submodules/schemas/gateway/v3/gate.page-change.SAMPLE-11.json
	 */
	export interface StateErrorOccurred {
		readonly step: "ERROR_OCCURRED",
		readonly errorTitle: string,
		readonly errorShortDescription: string,
		readonly errorLongDescription: string
	}

	export type State =
		StateChooseInputCurrency
		| StateAskForEmail
		| StateProcessPayment
		| StateErrorOccurred;

	export interface ActionSelectInputCurrency {
		readonly step: "SELECT_INPUT_CURRENCY",
		readonly callbackMethodName: string,
		readonly fromCurrency: Currency
	}

	export interface ActionSetEmail {
		readonly step: "SET_EMAIL",
		readonly callbackMethodName: string,
		readonly email: string
	}

	export interface WidgetServiceClientOptions {
		gatewayId: string,
		orderId: string,
		onStateChanged: WidgetServiceClient.StateChangedCallback
	}

	export type StateAction =
		ActionSelectInputCurrency
		| ActionSetEmail;

	export type StateChangedCallback = (state: State) => Promise<void>;
}

export class WidgetServiceClientMock implements WidgetServiceClient {
	private readonly _currencyFiatArray: Array<WidgetServiceClient.Currency> = [
		"EUR",
		"GBP",
		"RUB",
		"USD"
	];
	private readonly _currencyCryptoArray: Array<WidgetServiceClient.Currency> = [
		"BCH",
		"BTC",
		"DOGE",
		"ETH",
		"GAS",
		"LTC",
		"USDT",
		"DASH"
	];
	private readonly _processOrder: WidgetServiceClient.Order = {
		id: "order-123456",
		confirmedAt: new Date("2021-09-15T13:20:36.916927+03:00"),
		expiredAt: new Date("2021-09-15T13:40:36.916929+03:00"),
		rate: {
			symbol: "BTC/USD",
			rate: "49833.0807"
		},
		okRedirect: "https://example.com/order/success",
		failRedirect: "https://example.com/order/failure",
		paidStatus: "NONE",
		rejectionReason: null,
		state: "AWAIT_DEPOSIT",
		from: {
			"currency": "BTC",
			"amount": "0.00016054"
		},
		to: {
			"currency": "USD",
			"amount": "8"
		},
		deposit: {
			address: "2MwwYWnpmuiAgysbUBkqM7HLjshSy3X1TTN",
			uri: "bitcoin:2MwwYWnpmuiAgysbUBkqM7HLjshSy3X1TTN?amount=0.00016054&label=32af53b0-01bb-43b0-a5ef-870847919d56",
			amount: "0",
			underpayment: "0.00016054"
		},
		depositAcceptConfirmations: 5
	}

	private readonly _orderReceived1: WidgetServiceClient.Order = {
		id: "order-123456",
		confirmedAt: new Date("2021-09-15T13:20:36.916927+03:00"),
		expiredAt: new Date("2021-09-15T13:40:36.916929+03:00"),
		rate: {
			symbol: "BTC/USD",
			rate: "49833.0807"
		},
		okRedirect: "https://example.com/order/success",
		failRedirect: "https://example.com/order/failure",
		paidStatus: "PAID",
		rejectionReason: null,
		state: "AWAIT_DEPOSIT",
		from: {
			"currency": "BTC",
			"amount": "0.00016054"
		},
		to: {
			"currency": "USD",
			"amount": "8"
		},
		deposit: {
			address: "2MwwYWnpmuiAgysbUBkqM7HLjshSy3X1TTN",
			uri: "bitcoin:2MwwYWnpmuiAgysbUBkqM7HLjshSy3X1TTN?amount=0&label=32af53b0-01bb-43b0-a5ef-870847919d56",
			amount: "0.00016054",
			underpayment: "0.00000000"
		},
		depositAcceptConfirmations: 5
	}

	private readonly _orderReceived2: WidgetServiceClient.Order = {
		id: "order-123456",
		confirmedAt: new Date("2021-09-15T13:20:36.916927+03:00"),
		expiredAt: new Date("2021-09-15T13:40:36.916929+03:00"),
		rate: {
			symbol: "BTC/USD",
			rate: "49833.0807"
		},
		okRedirect: "https://example.com/order/success",
		failRedirect: "https://example.com/order/failure",
		paidStatus: "PAID",
		rejectionReason: null,
		state: "EXCHANGE",
		from: {
			"currency": "BTC",
			"amount": "0.00016054"
		},
		to: {
			"currency": "USD",
			"amount": "8"
		},
		deposit: {
			address: "2MwwYWnpmuiAgysbUBkqM7HLjshSy3X1TTN",
			uri: "bitcoin:2MwwYWnpmuiAgysbUBkqM7HLjshSy3X1TTN?amount=0&label=32af53b0-01bb-43b0-a5ef-870847919d56",
			amount: "0.00016054",
			underpayment: "0.00000000"
		},
		depositAcceptConfirmations: 5
	}

	private readonly _orderCompleted: WidgetServiceClient.Order = {
		id: "7ae366f4-c193-46cf-a6c3-ba6f4ba0c93e",
		confirmedAt: new Date("2021-09-15T13:20:36.916927+03:00"),
		expiredAt: new Date("2021-09-15T13:40:36.916929+03:00"),
		rate: {
			symbol: "BTC/USD",
			rate: "49833.0807"
		},
		okRedirect: "https://example.com/order/success",
		failRedirect: "https://example.com/order/failure",
		paidStatus: "PAID",
		rejectionReason: null,
		state: "COMPLETED",
		from: {
			"currency": "BTC",
			"amount": "0.00016054"
		},
		to: {
			"currency": "USD",
			"amount": "8"
		},
		deposit: {
			address: "2MwwYWnpmuiAgysbUBkqM7HLjshSy3X1TTN",
			uri: "bitcoin:2MwwYWnpmuiAgysbUBkqM7HLjshSy3X1TTN?amount=0&label=32af53b0-01bb-43b0-a5ef-870847919d56",
			amount: "0.00016054",
			underpayment: "0.00000000"
		},
		depositAcceptConfirmations: 5
	}

	private _currencyName: String | null = null;
	private _email: String | null = null;

	public state: WidgetServiceClient.State | null;

	private _onStateChanged: WidgetServiceClient.StateChangedCallback | null;
	private readonly _responseDelayMultiplier: number;

	public get onStateChanged(): WidgetServiceClient.StateChangedCallback {
		if (this._onStateChanged === null) {
			throw new Error("Wrong operation at current state. Callback deletage onStateChanged is not set yet.");
		}
		return this._onStateChanged;
	}

	public set onStateChanged(value: WidgetServiceClient.StateChangedCallback) {
		this._onStateChanged = value;
	}

	public switchState(step: WidgetServiceClient.State["step"]): void {

		switch (step) {
			case "ASK_FOR_EMAIL": {
				this.mockStateAskForEmail();
				break;
			}
			case "CHOOSE_INPUT_CURRENCY": {
				this.mockStateChooseInputCurrency();
				break;
			}
			case "PROCESS_PAYMENT": {
				this.mockStateProcessPayment();
				break;
			}
			case "PAYMENT_RECEIVE": {
				this.mockStatePaymentReceive1();
				setTimeout(() => {
					this.mockStatePaymentReceive2();
					if (this._onStateChanged === null || this.state === null) {
						return;
					}
					this._onStateChanged(this.state);
				}, 10000);
				break;
			}
			case "PAYMENT_COMPLETED": {
				this.mockStatePaymentCompleted();
				break;
			}
		}

		if (this._onStateChanged === null || this.state === null) {
			return;
		}
		this._onStateChanged(this.state);
	}

	public constructor(responseDelayMultiplier: number = 1) {
		this.state = null;
		this._onStateChanged = null;
		this._responseDelayMultiplier = responseDelayMultiplier;

		setTimeout(() => {
			this.switchState("CHOOSE_INPUT_CURRENCY");
		}, 1000 * this._responseDelayMultiplier);
	}

	public async invoke(action: WidgetServiceClient.StateAction): Promise<void> {
		switch (action.step) {
			case "SELECT_INPUT_CURRENCY":
				this._currencyName = action.fromCurrency;
				console.log(`Call invoke SELECT_INPUT_CURRENCY. Set fromCurrency ${this._currencyName}`);
				setTimeout(() => {
					this.switchState("ASK_FOR_EMAIL");
				}, 1000 * this._responseDelayMultiplier);;
				break;
			case "SET_EMAIL":
				this._email = action.email;
				console.log(`Call invoke SET_EMAIL. Set email ${this._email}`);
				setTimeout(() => {
					this.switchState("PROCESS_PAYMENT");
				}, 1000 * this._responseDelayMultiplier);
				break;
		}
	}

	public async dispose(): Promise<void> {
	}

	private mockStateAskForEmail(): void {
		console.log("Run mockStateAskForEmail");
		this.state = {
			step: "ASK_FOR_EMAIL",
			email: "",
			callbackMethodName: "SetEmail",
			progress: {
				currentPageNumber: 2
			}
		}
	}

	private mockStateChooseInputCurrency(): void {
		console.log("Run mockStateChooseInputCurrency");
		this.state = {
			step: "CHOOSE_INPUT_CURRENCY",
			rates: Object.freeze(
				this._currencyCryptoArray.reduce(((acc, crypto) => {
					const rates = this._currencyFiatArray.map((fiat) => ({
						from: crypto,
						to: fiat,
						symbol: `${crypto}/${fiat}`,
						base: `${this.randomFromRange(10, 10000)}.${this.randomFromRange(1000, 1000000)}`,
						maintenance: null
					}));
					acc.push(...rates);
					return acc;
				}), new Array<WidgetServiceClient.CurrencyRate>())
			),
			toAmount: `0.${this.randomFromRange(1000, 1000000)}`,
			toCurrency: this._currencyCryptoArray[Math.floor(Math.random() * this._currencyFiatArray.length)],
			callbackMethodName: "SetCurrencyFrom",
			progress: {
				currentPageNumber: 1
			}
		}
	}

	private mockStateProcessPayment(): void {
		console.log("Run mockStateProcessPayment");
		this.state = {
			step: "PROCESS_PAYMENT",
			order: this._processOrder,
			progress: {
				currentPageNumber: 3
			}
		}
	}

	private mockStatePaymentReceive1(): void {
		console.log("Run mockStatePaymentReceive1");
		this.state = {
			step: "PAYMENT_RECEIVE",
			order: this._orderReceived1,
			progress: {
				currentPageNumber: 4
			}
		}
	}

	private mockStatePaymentReceive2(): void {
		console.log("Run mockStatePaymentReceive2");
		this.state = {
			step: "PAYMENT_RECEIVE",
			order: this._orderReceived2,
			progress: {
				currentPageNumber: 4
			}
		}
	}

	private mockStatePaymentCompleted(): void {
		console.log("Run mockStatePaymentCompleted");
		this.state = {
			step: "PAYMENT_COMPLETED",
			order: this._orderCompleted,
			progress: {
				currentPageNumber: 5
			}
		}
	}

	private randomFromRange(min: number, max: number): WidgetServiceClient.Financial {
		return Math.floor(Math.random() * (max - min) + min).toString();
	}
}

export class WidgetServiceClientImpl implements WidgetServiceClient {
	public state: WidgetServiceClient.State | null;
	private readonly _onStateChanged: WidgetServiceClient.StateChangedCallback;
	private readonly _connection: HubConnection;
	private readonly _gatewayId: string;
	private readonly _orderId: string;

	public get onStateChanged(): WidgetServiceClient.StateChangedCallback {
		if (this._onStateChanged === null) {
			throw new Error("Wrong operation at current state. Callback deletage onStateChanged is not set yet.");
		}
		return this._onStateChanged;
	}

	public constructor(opts: WidgetServiceClient.WidgetServiceClientOptions) {
		this.state = null;
		this._gatewayId = opts.gatewayId;
		this._orderId = opts.orderId;
		this._onStateChanged = opts.onStateChanged;

		const connection = new HubConnectionBuilder()
			.withUrl("https://gate3-evolution-cexiopay.dev.kube/v3/gate")
			.configureLogging(LogLevel.Information)
			.build();
		connection.on("PageChange", (state: WidgetServiceClient.State) => {
			this.state = state;
			this._onStateChanged(state);
		});
		connection.onreconnected(async () => {
			await this.start();
		});

		this._connection = connection;
		this.start();
	}

	public async invoke(action: WidgetServiceClient.StateAction): Promise<void> {
		if (action.step === "SELECT_INPUT_CURRENCY") {
			await this.setCurrencyFrom(action);
		} else if (action.step === "SET_EMAIL") {
			await this.setEmail(action);
		}
	}

	private async setCurrencyFrom(action: WidgetServiceClient.ActionSelectInputCurrency): Promise<void> {
		try {
			await this._connection.invoke(action.callbackMethodName,
				this._gatewayId, this._orderId, action.fromCurrency);
		} catch (err) {
			console.error(err);
		}
	}

	private async setEmail(action: WidgetServiceClient.ActionSetEmail): Promise<void> {
		try {
			await this._connection.invoke(action.callbackMethodName,
				this._gatewayId, this._orderId, action.email);
		} catch (err) {
			console.error(err);
		}
	}

	public async dispose(): Promise<void> {
		console.log("SignalR disconnecting...");
		if (this._connection.state === HubConnectionState.Connected
			|| this._connection.state === HubConnectionState.Connecting
			|| this._connection.state === HubConnectionState.Reconnecting) {
			await this._connection.stop();
		}
	}

	private async start(): Promise<void> {
		console.log("SignalR connecting...");

		// Start connection only if we're disconnected now
		if (this._connection.state === HubConnectionState.Disconnected) {
			try {
				await this._connection.start();
			} catch (err) {
				console.log(err);
				setTimeout(this.start, 5000);
				return;
			}
		}

		// Once connected, trying to subscribe to the changes
		try {
			await this._connection.invoke("SubscribeToOrderChanges",
				this._gatewayId, this._orderId);
		} catch (err) {
			console.log(err);
			setTimeout(this.start, 5000);
		}
	}
}
