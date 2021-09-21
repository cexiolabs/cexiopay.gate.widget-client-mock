# Payment Widget Client

TODO description

## Usage
### local

TODO mock implementation

### release/snapshot

Для развертывания на сервере используется реализация клиента, которая уже
непосредственно общается через SignalR с бэкендом.
Использование библиотеки выглядит следующим образом:
```TypeScript
const gatewayId: string = "...";
const orderId: string = "...";
const onStateChanged = async (state: WidgetServiceClient.State, client: WidgetServiceClient): Promise<void> => {
	switch (state.step) {
		case "CHOOSE_INPUT_CURRENCY":
			const rates: ReadonlyArray<WidgetServiceClient.CurrencyRate> = state.rates;
			const toAmount: WidgetServiceClient.Financial = state.toAmount;
			const toCurrency: WidgetServiceClient.Currency = state.toCurrency;
			const progress: WidgetServiceClient.Progress = state.progress;
			const callbackMethodName: string = state.callbackMethodName;
			// Render this page
			// On currency choosed:
			const action: new WidgetServiceClient.ActionSelectInputCurrency = {
				callbackMethodName: callbackMethodName,
				fromCurrency: 'Currency here, g.e. USD/BTC/ETH/etc'
			};
			await client.invoke(action);

		case "ASK_FOR_EMAIL":
			const email: string | null = state.email;
			const progress: WidgetServiceClient.Progress = state.progress;
			const callbackMethodName: string = state.callbackMethodName;
			// Render this page
			// On email sent:
			const action: new WidgetServiceClient.ActionSelectInputCurrency = {
				callbackMethodName: callbackMethodName,
				email: 'email@example.com'
			};
			await client.invoke(action);
		
		case "PROCESS_PAYMENT":
			const order: WidgetServiceClient.Order = state.order;
			const progress: WidgetServiceClient.Progress = state.progress;
			// Render this page
		
		case "ERROR_OCCURRED":
			const errorTitle: string = state.errorTitle;
			const errorShortDescription: string = state.errorShortDescription;
			const errorLongDescription: string = state.errorLongDescription;
			// Show error to user
	}
}

const client: WidgetServiceClient = new WidgetServiceClient.WidgetServiceClientImpl(
	gatewayId, orderId, onStateChanged);
// Client is listening to callbacks at the moment
```
