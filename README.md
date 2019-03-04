# Public Rest & Websocket API for EtherMium DEX (2019-03-04)
# General API Information
* The base endpoint is: **https://api.ethermium.com/**
* All endpoints return a JSON object


# LIMITS
* Current API request limit is set at 1000 requests per minute. If you wish to send more operations, use the `batchOperations` endpoint to send multiple `orderCreate` and `orderCancel` operations in a single request

## Terminology
* `base token` refers to the asset that is the `price` of a symbol.
* `quote token` refers to the asset that is the `quantity` of a symbol.
* `wei` is the smallest unit of measurement in Ethereum. `1 ETH` = `1 000 000 000 000 000 000 WEI` (18 zeros)
* `contract_address` refers to the exchange contract address, currently: `0xa5CC679A3528956E8032df4F03756C077C1eE3F4`

# CALCULATING BUY AND SELL AMOUNTS
When creating an order you have to specify the amount you want to receive (amount buy) and the amount you are willing to pay (amount sell). Both amount must be specified in WEI. If you want to buy 1 token that has 18 decimals, the amount buy will be `1 000 000 000 000 000 000` (1 with 18 zeros, or 1e18). The same logic applies to amount sell.

Use the below function to get teh amountBuy and amountSell for a given quantity and price:

```javascript
const BigNumber = require('bignumber.js');
getAmountBuyAndSell(side, price, quantity, quoteTokenDecimals, baseTokenDecimals)
{
	switch (side)
	{
		case 'BUY':
			return [
				new BigNumber(quantity).times(new BigNumber(10).pow(quoteTokenDecimals)).toFixed(0,1),
				new BigNumber(quantity).times(new BigNumber(price)).times(new BigNumber(10).pow(baseTokenDecimals)).toFixed(0,0),
			]
		break;
		case 'SELL':
			return [
				new BigNumber(quantity).div(new BigNumber(price)).times(new BigNumber(10).pow(baseTokenDecimals)).toFixed(0,0),
				new BigNumber(quantity).times(new BigNumber(10).pow(quoteTokenDecimals)).toFixed(0,1)
			]
		break;
	}
}

[amount_buy, amount_sell] = getAmountBuyAndSell(...);
```

# SIGNING A HASH
Some API endpoints require the signing of a hash in order to prove the ownership of the account. For different operations the structure of the hash differs, please refer to the respective endpoints. After you have produced the hash, use the following function to sign:

```javascript
const ethUtil = require('ethereumjs-util');
sign(hash) {
	try 
	{
		const privateKeyBuf = Buffer.from(<private key>, 'hex'),
			hashBuf = ethUtil.toBuffer(hash),
			prefixedHashBuf = ethUtil.hashPersonalMessage(hashBuf);

		const sign = ethUtil.ecsign(prefixedHashBuf, privateKeyBuf);

		return {
			v: sign.v,
			r: ethUtil.bufferToHex(sign.r),
			s: ethUtil.bufferToHex(sign.s)
		};
	}
	catch (error)
	{
		console.error(`Error signing hash: ${error.message}`);
	}

}

var signed = sign(...);
console.log(signed.v, signed.r, signed.s);
```
* Replace 'private key' with your wallet private key

# Public API Endpoints
### Token Tickers
Returns the list of tokens with last prices, best bids/asks and 24 hour volumes
...
GET /v1/tokenTickers
...

**Response:**
```javascript
[
  {
    "quoteAddress": "0x6c6EE5e31d828De241282B9606C8e98Ea48526E2",
    "quoteSymbol": "HOT",
    "quoteSymbolDecimals": 18,
    "quoteVolume": "7462.998433",
    "baseAddress": "0x0000000000000000000000000000000000000000",
    "baseSymbol": "ETH",
    "baseSymbolDecimals": 18,
    "baseVolume": "7.3922603247161",
    "last": "0.000008010",
    "lowestAsk": "0.000008012",
    "highestBid": "0.000008008"
  }
]
```

### Token Order book
```
GET /v1/tokenOrderBook
```

**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ | ------------ | ------------
contractAddress | String | YES | The address of the exchange contract
quoteAddress | String | YES | Quote token address
baseAddress | String | YES | Base token address (use '0x0000000000000000000000000000000000000000' for ETH)
limit | Int | NO | Default 100; max 10000

**Response:**
```javascript
{
  "lastUpdateId": 1027024,
  "quoteAddress": "0x6c6EE5e31d828De241282B9606C8e98Ea48526E2",
  "quoteSymbol": "HOT",
  "quoteDecimals": 18,
  "baseAddress": "0x0000000000000000000000000000000000000000",
  "baseSymbol": "ETH",
  "baseDecimals": 18,
  "bids": [
    [
      "0.000000450",     // PRICE
      "431000.00000000"   // QTY
    ]
  ],
  "asks": [
    [
      "0.000000452",
      "12125633.00000000"
    ]
  ]
}
```

# Signed Endpoints
### New Token Order
```
POST /v1/tokenOrder
```

**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ | ------------ | ------------
contract_address | String	| YES | The contract address
token_buy_address |	String | YES | The token buy address
amount_buy | Number | YES | Amount to buy in WEI
token_sell_address | String | YES | The token sell address
amount_sell	| Number | YES | Amount to sell in WEI
nonce | Number | YES | A number for your own use (doesn’t have to be unique)
user_address | String | YES | The address of the order owner
v |	Number | YES | v value of the signature (check signature section)
r |	String | YES | r value of signature (check signature section)
s | String | YES | s value of signature (check signature section)
order_hash | String | YES | The hash of the new order 
stop_price | Number | NO | Stop price


* In order to get the order_hash, use the code below:
```javascript
const Web3Module = require('web3');
const web3 = new Web3Module('https://mainnet.infura.io');
createOrderHash(contract_address, token_buy_address, amount_buy, token_sell_address, amount_sell, nonce, user_address) {
	return web3.utils.soliditySha3(
		{type: 'address', value: contract_address},
		{type: 'uint160', value: token_buy_address},
		{type: 'uint256', value: amount_buy},
		{type: 'uint160', value: token_sell_address},
		{type: 'uint256', value: amount_sell},
		{type: 'uint256', value: nonce},
		{type: 'address', value: user_address}
	);
}
```

* For market orders simply set a lower/higher price, your order will be matched against the best available prices.

**Response:**
```javascript
success/failure message
```


### Cancel Token Order
```
POST /v1/cancelTokenOrder
```

**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ | ------------ | ------------
contract_address | String | YES | The contract address
order_hash | String	| YES | The order hash
user_address | String | YES | The order owner address
nonce |	Number | YES | A number for your own use (doesn’t have to be unique)
v | Number | YES | v value of signature
r | String | YES | r value of signature
s | String | YES | s value of signature
cancel_hash | String | YES | The cancel hash


* In order to get the cancel_hash, use the code below:
```javascript
const Web3Module = require('web3');
const web3 = new Web3Module('https://mainnet.infura.io');
createCancelOrderHash(contract_address, order_hash, user_address, nonce) {
	try {
		return web3.utils.soliditySha3(
			{type: 'address', value: contract_address},
			{type: 'bytes32', value: orderHash},
			{type: 'address', value: userAddr},
			{type: 'uint256', value: nonce}
		);
	}
	catch (error)
	{
		console.error(`Error signing hash: ${error.message}`);
	}
}
```

* For market orders simply set a low/high price your order will be matched against the best available prices.

**Response:**
```javascript
success/failure message
```


### My Token Orders
```
GET /v1/myTokenOrders
```


**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ | ------------ | ------------
contract_address | String | NO | The contract address
quoteAddress | String | NO |The order token address
user_address | String | YES | The order owner address

**Response:**
```javascript
{
  id: 1233445, // The order id
  contract_address: '0xa5CC679A3528956E8032df4F03756C077C1eE3F4' // The contract address
  token_address: '0x6c6EE5e31d828De241282B9606C8e98Ea48526E2' // The token address
  token_buy_address: '0x6c6EE5e31d828De241282B9606C8e98Ea48526E2' // The token buy address
  amount_buy: 1000233100000000, // The buy amount
  token_sell_address: '0x0000000000000000000000000000000000000000' // The token sell address
  amount_sell: 12230000000000000, // The sell amount
  nonce: 16762773848, // The nonce
  user_address	'0xf6919Baa4D921529d45b67E044C2Fbc53Caa531b' // The order owner address
  v: 27, // v value of signature
  r: '0x033711cdac43d170902e2903ab62f66182dc6c6f28aed9f0fcc1993b701f1628', // r value of signature
  s: '0x1a022337a2d638dc9fae11766bf04d12d57ec41a1d419f123bf1a9e494ebf4b9', // s value of signature
  order_hash: '0x02a65e31b0ca064e056f18260c2839bde8d6923f9056a117b8731b8605c2383d', // The order hash
  is_buy: true, // True if buy order
  unit_price: 0.0000856, // The unit price per token
  stop_price: 0.0000820, // The stop price (null if wasn't set)
  is_stopped: 1, // True if order is a stop-limit order
  amount_filled: 0, // Amount filled
  pending: 1000233100000000, // Unfilled amount
  approved: 0, //  Amount filled and confirmed on the blockchain
  not_unconfirmed_trade_ids: [], // Pending or confirmed trade ids
  fulfilled_at: null, // Time when order was fulfilled (nullable)
  canceled_at: null, // Time when order was canceled (nullable)
  created_at: 2018-09-15 12:43:22, // Time when order was created
  buy_decimals: 18, // Buy token decimals
  buy_symbol: 'HOT', // Buy token symbol
  buy_name:	'HoloToken', // Buy token name
  sell_decimals: 18, // Sell token decimals	
  sell_symbol: "ETH" // Sell token symbol 
  sell_name: "Ethereum" // Sell token name
}
```


### My Token Trades
```
GET /v1/myTokenTrades
```


**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ | ------------ | ------------
contract_address |	String | NO | The exchange contract address
token_address | String | NO | The trade token address
user_address | String | YES | The trade owner address
is_confirmed | Boolean | NO | If `true` will return confirmed and pending trades
is_pending | Boolean | NO | If `true` will return  pending trades (trades that have not been confirmed on the blockchain yet)

**Response:**
```javascript
{
    id: 122384844, // The trade id
    contract_address: '0xa5CC679A3528956E8032df4F03756C077C1eE3F4', // The contract address
    token_address: '0x6c6EE5e31d828De241282B9606C8e98Ea48526E2', // The token address
    is_buy: true, // True if buy trade
    unit_price: 0.0000856, // Trade unit price (in baseToken)
    maker_address: '0xf6919Baa4D921529d45b67E044C2Fbc53Caa531b', // Maker address
    maker_amount_filled: 190020202020200200000, // Maker amount filled (in WEI)
    taker_address: '0x4e0871dC93410305F83aEEB15741B2BDb54C3c5a', //	Taker address
    taker_amount_filled: 23884888888999990000, // Taker amount filled (in WEI)
    maker_amount_fee: 0, // Maker fee amount (nullable <12 Oct 2018)
    taker_amount_fee: 556644474748, // Taker fee amount (nullable <12 Oct 2018)
    maker_pct_fee: 0, // Maker fee (in percent)
    taker_pct_fee: 0.2, // Taker fee (in percent)
    taker_gas_fee: 123456766, // Taker gas fee (in taker buy token)
    taker_gas_limit_fee: 250000, // Taker gas limit fee
    gas_price: 5000000, // Gas price (in WEI)
    maker_amount_traded: 190020202020200200000, // Maker amount traded (nullable <12 Oct 2018)
    taker_amount_traded: 23884888888999990000, // Taker amount traded (nullable <12 Oct 2018)
    maker_amount_taken: 190020202020200200000, // Maker amount taken (minus all fees)
    taker_amount_taken:	189020202020200200000, // Taker amount taken (minus all fees)
    block_number: 58976542, // Trade block number (null if unconfirmed)
    transaction_hash: '0x1e124150bfcbf6fcf9540e8f6a0cd7e44ecfe8a11db3621a9b70e4ec32e6a292', // Trade transaction hash (null if not yet sent to blockchain)
    is_confirmed: false, // True if the trade has been confirmed on the blockchain (null if not sent yet)
    created_at '2018-09-23 14:45:42',	// Time when trade was created
    makerAmountBuy: 2200303939393993000000, // Maker amount buy
    makerAmountSell:	188733388484888888, // Maker amount sell
    makerNonce: 188278, // Maker nonce
    takerAmountBuy: 67888889993393939, // Taker amount buy
    takerAmountSell: 460000000000000000000, // Taker amount sell
    takerNonce: 166627773, // Taker nonce
    makerTokenBuy: '0x6c6EE5e31d828De241282B9606C8e98Ea48526E2',	// Maker token buy
    makerTokenSell: '0x0000000000000000000000000000000000000000', // Maker token sell
    takerTokenBuy: '0x0000000000000000000000000000000000000000', // Taker token buy
    takerTokenSell: '0x6c6EE5e31d828De241282B9606C8e98Ea48526E2', // Taker token sell
    makerOrderHash: '0x7430ad84f34f39f1e82530b2ef5a7fab079e88a7a804fe483bc48d452c55787b', // Maker order hash
    takerOrderHash: '0xa84ce76d9e15e85ab34fa9d0284a25c2369eaaa7b3e2f99cc621d63e82244f98' // Taker order hash
}
```

### Batch Operations
```
POST /v1/batchOperations
```
Use this endpoint to send multiple operations in a single request. We recommend sending no more than 100 operations per request for timely execution.

**Parameters:**
```javascript
[
    {
        operation: 'orderCreate',
        data: {
            contract_address: '0xa5CC679A3528956E8032df4F03756C077C1eE3F4',
            token_buy_address: '0x6c6EE5e31d828De241282B9606C8e98Ea48526E2', 
            amount_buy: '1000233100000000', 
            token_sell_address: '0x0000000000000000000000000000000000000000', 
            amount_sell: '12230000000000000',
            nonce: '16762773848',
            user_address: '0xf6919Baa4D921529d45b67E044C2Fbc53Caa531b',
            v: 27,
            r: '0x033711cdac43d170902e2903ab62f66182dc6c6f28aed9f0fcc1993b701f1628',
            s: '0x1a022337a2d638dc9fae11766bf04d12d57ec41a1d419f123bf1a9e494ebf4b9',
            order_hash: '0x02a65e31b0ca064e056f18260c2839bde8d6923f9056a117b8731b8605c2383d',
            stop_price: null
        }
    },
    {
        operation: 'orderCancel',
        data: {
            contract_address: '0xa5CC679A3528956E8032df4F03756C077C1eE3F4',
            order_hash: '0xecadf62bdbb0e70cddaef0b3a75352052e158d6e78ad71655ca511b59977140b',
            user_address: '0xf6919Baa4D921529d45b67E044C2Fbc53Caa531b',
            nonce: 1283474884,
            v: 27,
            r: '0x16271d5f0f83897c7fd61b32f8768e3f74d584da1eb9ae72414a4f26bfd2aa06',
            s: '0x57524d0b773a2570546eca7cd59f61acbf916587f196702fd0eb52c0086c209d',
            cancel_hash: '0xa8233ccaae89a6d85c35f88b662eb221e1ccadda1b1b0adbaf9c2a96fc6d9462'
        }
    },
    ...
]
```

### Get Gas Price
```
GET /v1/gasPrice
```

**Response:**
```javascript
{
    "standard": 4, // <5 mins to confirm
    "safe_low": 2, // <30 mins to confirm (nullable)
    "fast":	8, // <1 min to confirm (nullable)
    "fastest": 12, // Confirms in 1-2 blocks (nullable)
    data_source: 'EthGasStation' // The data source
}
```

### Withdraw
```
POST /v1/withdraw
```

**Parameters:**

Name | Type | Mandatory | Description
------------ | ------------ | ------------ | ------------
contract_address | String | YES | The contract address
token_address | String | YES | The token address for withdrawal (use `0x0000000000000000000000000000000000000000` for ETH)
amount | String	| YES | The amount to withdraw (in WEI)
user_address | String | YES | Your wallet address
nonce | String | YES | A number of your choosing (doesn't need to be unique)
v | String | YES | `v` value of signature
r | String | YES | `r` value of signature
s | String | YES | `s` value of signature
withdraw_hash | String | YES | The withdraw hash
gas_price | Number | NO | The gas price in GWei you are willing to pay. The higher the Gas price, the faster the withdrawal confirmation.

* In order to get the withdraw_hash, use the code below:
```javascript
const Web3Module = require('web3');
const web3 = new Web3Module('https://mainnet.infura.io');
createWithdrawHash(contract_address, token_address, amount, user_address, nonce) {
	return web3.utils.soliditySha3(
		{type: 'address', value: contract_address},
		{type: 'uint160', value: token_address},
		{type: 'uint256', value: amount},
		{type: 'address', value: user_address},
		{type: 'uint256', value: nonce}
	);
}

var withdraw_hash = createWithdrawHash(...);
```

**Response:**
```javascript
{  
    "transaction_hash": '0xb52aa0d76dff51622293b67584d84c2cab9f900cf5bc8bdf576f190567d8ea35'
}
```


# Websocket API
In order to connect to the websocket API we recomend using the `socket-io` library. The endpoint for websocket connections is `https://b.ethermium.com`

```javascript
const io = require('socket.io-client');
var socket = io('https://b.ethermium.com', {
	extraHeaders: {
		Origin: 'https://ethermium.com'
	},
	rejectUnauthorized: false,
	'reconnection': true,
  	'reconnectionDelay': 500,
  	'reconnectionAttempts': 100
});

socket.on( 'connect', function () {
    console.log( '[EtherMiumIo.connect] connected to server' );
});
 
socket.on( 'disconnect', function () {
    console.error( '[EtherMiumIo.connect] disconnected from server' );
} );

socket.on( 'error', function () {
    console.error( '[EtherMiumIo.connect] error ' );
});
````

### Subscribing to tokens
To subscribe to all trade and order events, use the following code:

```javascript
const ioreq = require('socket.io-request');

ioreq(socket).request('/contracts/subscribe', 'all');
ioreq(socket).request('/tokens/subscribe', 'all');
```

#### Subscribe to Trade event
Subscribe to this event to receive new trades
```javascript
socket.on('trades', event => {
    processTradeMessage(event);
});
```
**Payload:**
Check `My Token Trades` endpoint


#### Subscribe to Depth event
Subscribe to this events to receive orderbook updates
```javascript
socket.on('depth', event => {
    processDepthMessage(event);
});		
```

**Payload:**
```javascript
{
  "u": 1027024, // last orderbook update id
  "quoteAddress": "0x6c6EE5e31d828De241282B9606C8e98Ea48526E2",
  "quoteSymbol": "HOT",
  "quoteDecimals": 18,
  "baseAddress": "0x0000000000000000000000000000000000000000",
  "baseSymbol": "ETH",
  "baseDecimals": 18,
  "bids": [
    [
        "0.000000450",     // PRICE
        "431000.00000000"   // QTY
    ],
    [
        "0.000000451",
        "0"
    ]
  ],
  "asks": [
    [
        "0.000000452",
        "12125633.00000000"
    ]
  ]
}
```
### How to manage a local order book correctly
* Open a websocket connection and subscribe to the depth event
* Get a orderbook snapshot using `/v1/tokenOrderBook` endpoint
* Delete all orders where u < lastUpdateId 
* The data in each event is the total quantity per price level
* If the quantity is 0, remove the price level












