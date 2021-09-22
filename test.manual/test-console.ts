#!/usr/bin/env node
import * as readline from 'readline';
import { WidgetServiceClient, WidgetServiceClientImpl, WidgetServiceClientMock } from "../src/index";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let client: WidgetServiceClient | null = null;

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

let jsonChunck = "";

console.clear();
console.log("Select WidgetServiceClient implementation");
console.log("1 - WidgetServiceClientMock");
console.log("2 - WidgetServiceClientImpl");

rl.question("", (answer) => {
	console.clear();
	switch (answer.toLowerCase()) {
		case "1":
			console.log("Creating an instance of WidgetServiceClientMock...");
			startWidgetServiceClientMock();
			break;
		case "2":
			console.log("Creating an instance of WidgetServiceClientImpl...");
			startWidgetServiceClientImpl();
			break;
	}
});

rl.on('line', async (input) => {
	jsonChunck += input;
	try {
		const obj = JSON.parse(jsonChunck);
		if (client === null) {
			console.log("Client not initialized");
			return;
		}
		await client.invoke(obj);
		jsonChunck = "";
	} catch (e) {		
	}
});

function startWidgetServiceClientMock() {
	client = new WidgetServiceClientMock();
	client.onStateChanged = async (state: WidgetServiceClient.State) => {
		console.clear();
		console.log(JSON.stringify(state, null, 2));
		jsonChunck = "";
	}
}

function startWidgetServiceClientImpl() {
	const onStateChanged = async (state: WidgetServiceClient.State) => {
		console.clear();
		console.log(JSON.stringify(state, null, 2));
		jsonChunck = "";
	}

	client = new WidgetServiceClientImpl({
		gatewayId: "",
		orderId: "",
		onStateChanged
	});
}
