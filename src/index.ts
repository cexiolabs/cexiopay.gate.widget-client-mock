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
     * @see ./submodules/schemas/gateway/v3/gate.page-change.SAMPLE-1.json
     */
    export interface StateChooseInputCurrency {
        readonly step: "CHOOSE_INPUT_CURRECY";
        readonly rates: ReadonlyArray<CurrencyRate>;
        readonly toAmount: Financial;
        readonly toCurrency: Currency;
    }

    /**
     * @see ./submodules/schemas/gateway/v3/gate.page-change.SAMPLE-2.json
     */
    export interface StateAskForEmail {
        readonly step: "ASK_FOR_EMAIL",
        readonly email: string | null;
    }

    export type State =
        StateChooseInputCurrency
        | StateAskForEmail
        // | StateTBD
        // | StateTBD
        // | StateTBD
        // | StateTBD
        // | StateTBD
        ;

    export interface ActionSelectInputCurrency {
        readonly step: "SELECT_INPUT_CURRECY";
        readonly fromCurrency: Currency;
    }

    export interface ActionSetEmail {
        readonly step: "SET_EMAIL";
        readonly email: string;
    }

    export type StateAction =
        ActionSelectInputCurrency
        | ActionSetEmail
        // | ActionTBD
        // | ActionTBD
        // | ActionTBD
        // | ActionTBD
        ;

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
			case "SELECT_INPUT_CURRECY":
				this._currenctCurrency = action.fromCurrency;
				break;
			case "SET_EMAIL":
				this._currenctEmail = action.email;
				break;
		}
	}

	public async dispose(): Promise<void> {
		if (this._timeoutId !== null) {
			clearTimeout(this._timeoutId);
		}
	}

	private startTimeout(timeoutDelay: number): void {
		this._timeoutId = setTimeout(async () => {
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
		}, timeoutDelay);
	}

	private async mockStateAskForEmail(): Promise<void> {
		console.log("Run mockStateAskForEmail");
		this.state = {
			step: "ASK_FOR_EMAIL",
			email: null
		}
	}

	private async mockStateChooseInputCurrency(): Promise<void> {
		console.log("Run mockStateChooseInputCurrency");
		this.state = {
			step: "CHOOSE_INPUT_CURRECY",
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
		}
	}

	private randomFromRange(min: number, max: number): WidgetServiceClient.Financial {
		return Math.floor(Math.random() * (max - min) + min).toString();
	}
}

export class WidgetServiceClientImpl implements WidgetServiceClient {
	public state: WidgetServiceClient.State | null;
	private _onStateChanged: WidgetServiceClient.StateChangedCallback | null;

	public get onStateChanged(): WidgetServiceClient.StateChangedCallback {
		if (this._onStateChanged === null) {
			throw new Error("Wrong operation at current state. Callback deletage onStateChanged is not set yet.");
		}
		return this._onStateChanged;
	}
	public set onStateChanged(value: WidgetServiceClient.StateChangedCallback) { this._onStateChanged = value; }

	public constructor() {
		this.state = null;
		this._onStateChanged = null;
	}

	public invoke(action: WidgetServiceClient.StateAction): Promise<void> {
		throw new Error("Method not implemented.");
	}

	public dispose(): Promise<void> {
		throw new Error("Method not implemented.");
	}
}
