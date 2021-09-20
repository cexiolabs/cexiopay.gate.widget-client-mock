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

    export interface CurrencyRate {
        readonly from: Currency,
        readonly to: Currency,
        readonly symbol: string,
        readonly base: Financial,
        readonly maintenance: null
    }

    /**
     * @see ./submodules/schamas/gateway/v3/gate.page-change.SAMPLE-1.json
     */
    export interface StateChooseInputCurrency {
        readonly step: "CHOOSE_INPUT_CURRECY";
        readonly rates: ReadonlyArray<CurrencyRate>;
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
    private readonly _currencyFiatArray: WidgetServiceClient.Currency[] = [
        "EUR",
        "GBP",
        "RUB",
        "USD"
    ];
    private readonly _currencyCryptoArray: WidgetServiceClient.Currency[] = [
        "BCH",
        "BTC",
        "DOGE",
        "ETH",
        "GAS",
        "LTC",
        "USDT",
        "DASH"
    ];

    private _currentStateIndex: number = 0;

    private _intervalId: number | null = null;

    private readonly _mockStateArray: any[] = [
        this.mockStateAskForEmail.bind(this),
        this.mockStateChooseInputCurrency.bind(this)
    ];

    private isOnStateChangedBusy: boolean = false;

    private interval: number;

    public state: WidgetServiceClient.State | null;

    private _onStateChanged: WidgetServiceClient.StateChangedCallback | null;

    public get onStateChanged(): WidgetServiceClient.StateChangedCallback {
        if (this._onStateChanged === null) {
            throw new Error("Wrong operation at current state. Callback deletage onStateChanged is not set yet.");
        }
        return this._onStateChanged;
    }

    public set onStateChanged(value: WidgetServiceClient.StateChangedCallback) { this._onStateChanged = value; }

    public constructor(interval: number = 5000) {
        this.state = null;
        this._onStateChanged = null;
        this.interval = interval;

        this.startInterval();
    }

    public invoke(action: WidgetServiceClient.StateAction): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async dispose(): Promise<void> {
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
        }
    }

    private startInterval(): void {
        this._intervalId = setInterval(async () => {
            this._mockStateArray[this._currentStateIndex]();

            this._currentStateIndex += 1;
            if (this._currentStateIndex >= this._mockStateArray.length) {
                this._currentStateIndex = 0;
            }

            if (this._onStateChanged === null || this.state === null || this.isOnStateChangedBusy === true) {
                return;
            }

            this.callStateChanged(this.state);
            this.state = null;
        }, this.interval);
    }

    private async callStateChanged(state: WidgetServiceClient.State) {
        if (this._onStateChanged === null) {
            throw new Error("Somthing is wrong, onStateChanged is null");
        }
        this.isOnStateChangedBusy = true;
        await this._onStateChanged(state);
        this.isOnStateChangedBusy = false;
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
                }), <WidgetServiceClient.CurrencyRate[]>[])
            ),
            toAmount: `0.${this.randomFromRange(1000, 1000000)}`,
            toCurrency: this._currencyCryptoArray[Math.floor(Math.random() * this._currencyFiatArray.length)],
        }
    }

    private randomFromRange(min: number, max: number): WidgetServiceClient.Financial {
        return Math.floor(Math.random() * (max - min + 1) + min).toString();
    }

}
