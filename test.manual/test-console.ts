#!/usr/bin/env node
import { ConsoleLogger } from '@microsoft/signalr/dist/esm/Utils';
import * as readline from 'readline';
import { WidgetServiceClient, WidgetServiceClientImpl, WidgetServiceClientMock } from "../src/index";

let client: WidgetServiceClient | null = null;

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

console.clear();
console.log("Select WidgetServiceClient implementation");
console.log("1 - WidgetServiceClientMock");
console.log("2 - WidgetServiceClientImpl");

rl.question("", (answer) => {
	console.clear();
	switch (answer.toLowerCase()) {
		case "1":
			console.log("Starting WidgetServiceClientMock...");
			startWidgetServiceClientMock();
			break;
		case "2":
			console.log("Starting startWidgetServiceClientImpl...");
			startWidgetServiceClientImpl();
			break;
		default:
			console.log("Invalid answer");
	}
});
rl.on('line', (input) => {
	if (client === null) {
		return;
	}
	switch (input[0]) {
		case "e":
			client.invoke({
				step: "SET_EMAIL",
				callbackMethodName: "",
				email: input.substring(1)
			});
			break;
		case "c":
			client.invoke({
				step: "SELECT_INPUT_CURRENCY",
				callbackMethodName: "",
				fromCurrency: input.substring(1)
			});
			break;
		default:
			console.log(`Recived: ${input}`);
			console.log("Use prefix 'e' of 'c' to call invoke with object SET_EMAIL or SELECT_INPUT_CURRENCY");
			console.log("Exaample:");
			console.log("cBTC - call SELECT_INPUT_CURRENCY with value BTC");
			console.log("etest@mail.com - call SET_EMAIL with value test@mail.com");
	}
});

function startWidgetServiceClientMock() {
	client = new WidgetServiceClientMock();
	client.onStateChanged = async (state: WidgetServiceClient.State) => {
		console.log(JSON.stringify(state, null, 2));
	}
}

function startWidgetServiceClientImpl() {
	const onStateChanged = async (state: WidgetServiceClient.State) => {
		console.clear();
		console.log(JSON.stringify(state, null, 2));
	}

	client = new WidgetServiceClientImpl({
		gatewayId: "",
		orderId: "",
		onStateChanged
	});
}

// console.error("Not implemented yet");
// process.exit(1);
