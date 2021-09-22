import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

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
		readonly step: "PROCESS_PAYMENT",
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

	private _currenctCurrency: String | null = null;

	private _currenctEmail: String | null = null;

	private _currentStateIndex: number = 0;

	private _timeoutId: number | null = null;

	private readonly _mockStateArray: Array<any> = [
		this.mockStateAskForEmail.bind(this),
		this.mockStateChooseInputCurrency.bind(this)
	];

	public state: WidgetServiceClient.State | null;

	private _onStateChanged: WidgetServiceClient.StateChangedCallback | null;

	public get onStateChanged(): WidgetServiceClient.StateChangedCallback {
		if (this._onStateChanged === null) {
			throw new Error("Wrong operation at current state. Callback deletage onStateChanged is not set yet.");
		}
		return this._onStateChanged;
	}

	public set onStateChanged(value: WidgetServiceClient.StateChangedCallback) { this._onStateChanged = value; }

	public constructor(timeoutDelay: number = 5000) {
		this.state = null;
		this._onStateChanged = null;
		this.startTimeout(timeoutDelay);
	}

	public async invoke(action: WidgetServiceClient.StateAction): Promise<void> {
		switch (action.step) {
			case "SELECT_INPUT_CURRENCY":
				this._currenctCurrency = action.fromCurrency;
				console.log(`Call invoke SELECT_INPUT_CURRENCY. Set fromCurrency ${this._currenctCurrency}`)
				break;
			case "SET_EMAIL":
				this._currenctEmail = action.email;
				console.log(`Call invoke SET_EMAIL. Set fromCurrency ${this._currenctEmail}`)
				break;
		}
	}

	public async dispose(): Promise<void> {
		if (this._timeoutId !== null) {
			clearTimeout(this._timeoutId);
		}
	}

	private startTimeout(timeoutDelay: number): void {
		const handler: TimerHandler = async () => {
			this._mockStateArray[this._currentStateIndex]();

			this._currentStateIndex += 1;
			if (this._currentStateIndex >= this._mockStateArray.length) {
				this._currentStateIndex = 0;
			}

			if (this._onStateChanged === null || this.state === null) {
				return;
			}

			try {
				await this._onStateChanged(this.state);
			} catch (e) {
				throw Error("Error in onStageChanged function");
			} finally {
				this.startTimeout(timeoutDelay);
			}
		};
		this._timeoutId = setTimeout(handler, timeoutDelay);
	}

	private async mockStateAskForEmail(): Promise<void> {
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

	private async mockStateChooseInputCurrency(): Promise<void> {
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

	private randomFromRange(min: number, max: number): WidgetServiceClient.Financial {
		return Math.floor(Math.random() * (max - min) + min).toString();
	}
}

export class WidgetServiceClientImpl implements WidgetServiceClient {
	public state: WidgetServiceClient.State | null;
	private _onStateChanged: WidgetServiceClient.StateChangedCallback;
	private _connection: HubConnection;
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

		async function start() {
			try {
				await connection.start();
				await connection.invoke("SubscribeToOrderChanges",
					opts.gatewayId, opts.orderId);
				console.log("SignalR connected...");
			} catch (err) {
				console.log(err);
				setTimeout(start, 5000);
			}
		};

		connection.onclose(async () => {
			await start();
		});

		this._connection = connection;
		start();
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
		await this._connection.stop();
		console.log("SignalR disconnected...");
	}
}
