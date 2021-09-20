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
	 * Represent currency code, like: "USD", "BTC", etc
	 */
	export type Currency = string;

	/**
	 * Represent financial value, like "10.42"
	 */
	export type Financial = string;

	/**
	 * @see ./submodules/schamas/gateway/v3/gate.page-change.SAMPLE-1.json
	 */
	export interface StateChooseInputCurrency {
		readonly step: "CHOOSE_INPUT_CURRECY";
		readonly rates: ReadonlyArray<
			{
				readonly from: Currency,
				readonly to: Currency,
				readonly symbol: "BTC/USD",
				readonly base: Financial,
				readonly maintenance: null
			}
		>;
		readonly toAmount: Financial;
		readonly toCurrency: Currency;
	}

	/**
	 * @see ./submodules/schamas/gateway/v3/gate.page-change.SAMPLE-2.json
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
