# Payment Widget Client

TODO description


## Builds

### local

### release/snapshot

## Usage

### Test Console

Для тестирование библиотеки разработана тест-консоль.

Запуск

```shell
./node_modules/.bin/ts-node test.manual/test-console.ts
Choose WidgetServiceClient implementation (1 - WidgetServiceClientMock, 2 - WidgetServiceClientImpl): 2
Creating an instance... done.
The application is ready to use. You will see all events in the console. Also you may raw JSON to call invoke.
....
```

### Embed into a web application

Для локального тестирования используется mock реализация клиента.
Подключение библиотеки выполняется с помощью следующей команды:
```shell
yarn add @cexiolabs/cexiopay.gate.widget-client-mock
```
Использование библиотеки выглядит следующим образом:

**JavaScript**
```javascript
const widgetClient = new WidgetServiceClientMock();
widgetClient.onStateChanged = async (state) => {
	// do something with new state
};
```

**TypeScript**
```typescript
const widgetClient: WidgetServiceClient = new WidgetServiceClientMock();
widgetClient.onStateChanged = async (state: WidgetServiceClient.State) => {
	// do something with new state
};
```
Конструктор также принимает дополнительный параметр:
```javascript
const widgetClient = new WidgetServiceClientMock(responseDelayMultiplier: 1);
```
Это число задаёт значение, на которое будет умножаться задержка всех команд,
которая равна 1 секунде.
Используйте этот параметр, чтобы сделать эмуляцию слабого интернет-соединения,
когда сервер отвечает не моментально, а лишь спустя какое-то время. Этот параметр
повлияет на скорость ответа после вызова `widgetClient.invoke(action)`.

Как уже сказано выше, вызов `widgetClient.invoke(action)` запускает триггер
события `widgetClient.onStateChanged` с задержкой 1 секунду по умолчанию. Флоу
виджета получается следующий:
1. Создаём инстанс класса `WidgetServiceClientMock`
2. Через секунду приходит обновление `widgetClient.onStateChanged` со страницей
`state.step === CHOOSE_INPUT_CURRENCY`. Это означает, что рисуем страницу выбора
валюты.
3. Как только валюта выбрана, отправляем её:
```javascript
const selectedCurrency = "BTC"; // selected value here
await widgetClient.invoke({
	step: "SELECT_INPUT_CURRENCY",
	callbackMethodName: this.globalStateVariable.callbackMethodName,
	fromCurrency: selectedCurrency
});
```
4. Через секунду приходит обновление `widgetClient.onStateChanged` со страницей
`state.step === ASK_FOR_EMAIL`. Это означает, что рисуем страницу ввода email.
5. Как только email введён, отправляем его:
```javascript
const inputEmail = "email@example.com"; // input value here
await widgetClient.invoke({
	step: "SET_EMAIL",
	callbackMethodName: this.globalStateVariable.callbackMethodName,
	email: inputEmail
});
```
6. Через секунду приходит обновление `widgetClient.onStateChanged` со страницей
`state.step === PROCESS_PAYMENT`. Это означает, что рисуем страницу с QR кодом
и просьбой оплатить.
7. Поскольку у mock реализации отсутствует бэкенд, который следит за изменением
состояния оплаты по QR коду, нам необходимо вручную запросить смену страницы в
консоли разработчика в браузере.
Нам нужно найти глобально и вызвать метод `widgetClient.switchState("...")`.
Например, для Vue.js SPA это будет выглядеть примерно так: https://stackoverflow.com/a/51848743
Поддерживаемые state значения, которые можно передать в этот метод, следующие:
- CHOOSE_INPUT_CURRENCY - окно выбора валюты
- ASK_FOR_EMAIL - окно ввода эл.почты
- PROCESS_PAYMENT - 
- PAYMENT_RECEIVE
- PAYMENT_COMPLETED
Также хочу обратить внимание, что PAYMENT_RECEIVE эмулирует вызов сразу двух-трёх
событий с задержкой в 10 секунд. Это сделано потому, что между AWAIT_DEPOSIT и COMPLETED
есть промежуточные события EXCHANGE/EXCHANGED которые не имеют своей собственной
страницы для отображения, поэтому при их возникновении всё ещё будет отображаться
страница PAYMENT_RECEIVE, нужно чтобы код был к этому готов.

Для развертывания на сервере используется реализация клиента, которая уже
непосредственно общается через SignalR с бэкендом.
Использование библиотеки выглядит следующим образом:  
**JavaScript**
```javascript
const options = {
	gatewayId: "...",
	orderId: "order-123456",
	onStateChanged: async (state) => {
		// do something with new state
	}
};

const widgetClient = new WidgetServiceClientImpl(options);
// Client is listening to callbacks at the moment
// ...
await client.dispose(); // optional call, this method will disconnect from the server
```
**TypeScript**
```typescript
const options: WidgetServiceClient.WidgetServiceClientOptions = {
	gatewayId: "...",
	orderId: "order-123456",
	onStateChanged: async (state: WidgetServiceClient.State) => {
		// do something with new state
	}
};

const widgetClient: WidgetServiceClient = new WidgetServiceClient.WidgetServiceClientImpl(options);
// Client is listening to callbacks at the moment
// ...
await client.dispose(); // optional call, this method will disconnect from the server
```
